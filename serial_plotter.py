"""
 System -
   OS:  [Linux Mint 22.1 x86 Cinnamon]
   IDE: [CLion + PlatformIO]
 Author: Zain Ali

 Arduino Serial Plotter
 A generic program that reads from an arduino and dumps to a graph
 useful to help debug and understand what the code is doing

 The Arduino needs to have a print format of
    tag1:val1, tag2: val2, tag3:val3 etc. \n

 the graph updates with time, so values too old will disappear

 A requirement is that common value ranges are easily visible
    0-inf range of random numbers
    0-2^10 ADC of the Atmega 328P
    0-2^8  PWM speed ATMEGA 328P
    0-1    boolean values
    

    this is solved kinda by scaling all inputs

Dependencies:
    pip install pyserial matplotlib numpy

Usage:
    python serial_plotter.py --port COM3 --baud 9600
    python serial_plotter.py --port /dev/ttyUSB0 --baud 115200 --window 60
    python serial_plotter.py            # no --port  →  synthetic demo mode
"""

import sys
import threading
import argparse
from collections import defaultdict, deque
from datetime import datetime, timedelta

import serial
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import matplotlib.dates as mdates
from matplotlib.ticker import FuncFormatter

CFG: dict = {
    'window':     30,     # seconds of history to keep visible
    'refresh_ms': 150,    # animation redraw interval
    'verbose':    False,
}


_data:    dict[str, deque]  = defaultdict(deque)   # tag → deque[(datetime, float)]
_tag_min: dict[str, float]  = {}
_tag_max: dict[str, float]  = {}
_lock    = threading.Lock()
_running = True

# Ten visually distinct colours that work on a dark background
PALETTE = [
    '#4fc3f7', '#81c784', '#ffb74d', '#e57373',
    '#ba68c8', '#4db6ac', '#fff176', '#ff8a65',
    '#90a4ae', '#f48fb1',
]



def parse_line(line: str) -> dict[str, float]:
    """'tag1: v1, tag2: v2' → {tag1: v1, tag2: v2}  (non-numeric values skipped)"""
    result: dict[str, float] = {}
    for segment in line.split(','):
        segment = segment.strip()
        if ':' not in segment:
            continue
        key, _, raw = segment.partition(':')
        try:
            result[key.strip()] = float(raw.strip())
        except ValueError:
            pass
    return result


def _ingest(pairs: dict[str, float], ts: datetime) -> None:
    """Thread-safe insertion into shared data structures."""
    with _lock:
        for tag, val in pairs.items():
            _data[tag].append((ts, val))
            if tag not in _tag_min:
                _tag_min[tag] = val
                _tag_max[tag] = val
            else:
                if val < _tag_min[tag]:
                    _tag_min[tag] = val
                if val > _tag_max[tag]:
                    _tag_max[tag] = val

def serial_reader(port: str, baud: int) -> None:
    global _running
    try:
        ser = serial.Serial(port, baud, timeout=1)
        print(f'[serial] connected → {port} @ {baud} baud')
    except serial.SerialException as exc:
        print(f'[serial] cannot open {port}: {exc}', file=sys.stderr)
        _running = False
        return

    while _running:
        try:
            raw  = ser.readline()
            line = raw.decode('utf-8', errors='ignore').strip()
        except serial.SerialException as exc:
            if _running:
                print(f'[serial] read error: {exc}', file=sys.stderr)
            break
        if not line:
            continue
        if CFG['verbose']:
            print(f'[raw] {line}')
        pairs = parse_line(line)
        if pairs:
            _ingest(pairs, datetime.now())

    try:
        ser.close()
    except Exception:
        pass
    print('[serial] disconnected')




def demo_feeder() -> None:
    import math, random, time as _time
    t = 0.0
    while _running:
        _ingest({
            'heartRate': 60  + 30  * math.sin(t * 0.25),
            'spo2':      95  + 4   * math.sin(t * 0.08 + 1.0),
            'motion':    float(math.sin(t * 0.7) > 0.5),
            'raw_ir':    512 + 400 * math.sin(t * 0.5),
        }, datetime.now())
        t += 0.15
        _time.sleep(0.15)




def _norm(val: float, lo: float, hi: float) -> float:
    return 0.5 if lo == hi else (val - lo) / (hi - lo)



fig, ax = plt.subplots(figsize=(15, 6))
fig.patch.set_facecolor('#121212')
ax.set_facecolor('#1a1a1a')
for spine in ax.spines.values():
    spine.set_edgecolor('#2e2e2e')
ax.tick_params(colors='#999999', which='both', labelsize=8)
ax.set_ylim(-0.06, 1.06)
ax.set_ylabel('Normalised  (0 = min seen,  1 = max seen)', color='#666666', fontsize=8)
ax.set_title('Arduino Serial Plotter — hover for actual values', color='#cccccc', fontsize=11)
ax.grid(True, color='#242424', linestyle='-', linewidth=0.5)


def _ms_fmt(x, _pos):
    """X-axis tick formatter: HH:MM:SS.mmm"""
    try:
        dt = mdates.num2date(x).replace(tzinfo=None)
        return dt.strftime('%H:%M:%S.') + f'{dt.microsecond // 1000:03d}'
    except Exception:
        return ''


ax.xaxis.set_major_formatter(FuncFormatter(_ms_fmt))
ax.xaxis.set_major_locator(mdates.AutoDateLocator())

# Hover annotation box
_annot = ax.annotate(
    '', xy=(0, 0), xytext=(16, 16), textcoords='offset points',
    bbox=dict(boxstyle='round,pad=0.5', facecolor='#1e1e1e',
              edgecolor='#555555', alpha=0.96),
    arrowprops=dict(arrowstyle='->', color='#666666', lw=0.8),
    color='#dddddd', fontsize=8, family='monospace',
    zorder=20, visible=False,
)

_lines: dict[str, matplotlib.lines.Line2D] = {}



def _update(_frame):
    window  = CFG['window']
    now     = datetime.now()
    cutoff  = now - timedelta(seconds=window)

    with _lock:
        # prune data outside the rolling window
        for dq in _data.values():
            while dq and dq[0][0] < cutoff:
                dq.popleft()

        # snapshot for rendering (outside lock is unsafe — copy here)
        snap   = {tag: list(dq) for tag, dq in _data.items() if dq}
        ranges = {tag: (_tag_min[tag], _tag_max[tag]) for tag in snap}

    for tag, pts in snap.items():
        lo, hi = ranges[tag]
        xs = [mdates.date2num(ts) for ts, _ in pts]
        ys = [_norm(v, lo, hi)    for _,  v in pts]

        if tag not in _lines:
            color = PALETTE[len(_lines) % len(PALETTE)]
            (ln,) = ax.plot([], [], label=tag, color=color,
                            linewidth=1.6, alpha=0.9, solid_capstyle='round')
            _lines[tag] = ln

        _lines[tag].set_data(xs, ys)

    if snap:
        ax.set_xlim(mdates.date2num(cutoff), mdates.date2num(now))

    ax.legend(
        handles=list(_lines.values()),
        loc='upper left', fontsize=7.5,
        facecolor='#1a1a1a', edgecolor='#3a3a3a',
        labelcolor='#cccccc', framealpha=0.92,
    )
    return list(_lines.values())




def _on_hover(event):
    if event.inaxes is not ax or event.xdata is None:
        if _annot.get_visible():
            _annot.set_visible(False)
            fig.canvas.draw_idle()
        return

    mouse_dt = mdates.num2date(event.xdata).replace(tzinfo=None)
    tolerance = CFG['window'] * 0.12   # ignore if cursor is far from all data

    rows: list[tuple] = []
    best_x_num = event.xdata
    best_y_norm = 0.5
    best_dist   = float('inf')

    with _lock:
        for tag, dq in _data.items():
            if not dq:
                continue
            lo = _tag_min.get(tag, 0.0)
            hi = _tag_max.get(tag, 1.0)
            pts = list(dq)
            nearest = min(pts, key=lambda p: abs((p[0] - mouse_dt).total_seconds()))
            ts, val = nearest
            dist = abs((ts - mouse_dt).total_seconds())
            rows.append((dist, tag, val, lo, hi, ts))
            if dist < best_dist:
                best_dist   = dist
                best_x_num  = mdates.date2num(ts)
                best_y_norm = _norm(val, lo, hi)

    if not rows or best_dist > tolerance:
        if _annot.get_visible():
            _annot.set_visible(False)
            fig.canvas.draw_idle()
        return

    rows.sort(key=lambda r: r[0])
    ref_ts = rows[0][5]
    ts_str = ref_ts.strftime('%H:%M:%S.') + f'{ref_ts.microsecond // 1000:03d}'

    text_parts = [f'@ {ts_str}']
    for dist, tag, val, lo, hi, ts in rows:
        text_parts.append(f'  {tag}: {val:.6g}   [{lo:.4g} – {hi:.4g}]')

    _annot.xy = (best_x_num, best_y_norm)
    _annot.set_text('\n'.join(text_parts))
    _annot.set_visible(True)
    fig.canvas.draw_idle()


fig.canvas.mpl_connect('motion_notify_event', _on_hover)

_ani = animation.FuncAnimation(
    fig, _update,
    interval=CFG['refresh_ms'],
    blit=False,
    cache_frame_data=False,
)



def main():
    global _running

    parser = argparse.ArgumentParser(
        description='Live Arduino serial plotter with per-channel normalisation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument('--port', metavar='PORT',
                        help='Serial port (e.g. COM3, /dev/ttyUSB0). '
                             'Omit to run built-in demo mode.')
    parser.add_argument('--baud', type=int, default=9600, metavar='BAUD',
                        help='Baud rate (default: 9600)')
    parser.add_argument('--window', type=int, default=30, metavar='SECS',
                        help='Rolling history window in seconds (default: 30)')
    parser.add_argument('--refresh', type=int, default=150, metavar='MS',
                        help='Graph refresh interval in ms (default: 150)')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Print raw serial lines to stdout')
    args = parser.parse_args()

    CFG['window']     = args.window
    CFG['refresh_ms'] = args.refresh
    CFG['verbose']    = args.verbose

    if args.port:
        t = threading.Thread(target=serial_reader,
                             args=(args.port, args.baud), daemon=True)
    else:
        print('[demo] No --port supplied — running with synthetic data.  Ctrl+C to quit.')
        t = threading.Thread(target=demo_feeder, daemon=True)

    t.start()

    try:
        plt.tight_layout()
        fig.autofmt_xdate(rotation=30, ha='right')
        plt.show()
    except KeyboardInterrupt:
        pass
    finally:
        _running = False
        print('Exiting.')


if __name__ == '__main__':
    main()
