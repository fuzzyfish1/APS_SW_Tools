// live serial plotter - reads tagged values from an arduino and renders them on a canvas
//
// arduino output format:   tag1: value1, tag2: value2\n
//
// all channels are normalised to [0,1] based on min/max seen so far,
// so booleans, ADC (0-1023), PWM (0-255), and arbitrary floats all show on the same plot
//
// works in Chrome/Edge (web) and Electron (desktop) via the Web Serial API

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import UsbIcon from '@mui/icons-material/Usb'
import UsbOffIcon from '@mui/icons-material/UsbOff'
import BugReportIcon from '@mui/icons-material/BugReport'

import { useSerial, type ParsedSerialRow } from '../hooks/useSerial'

// 10 colours that read well on a dark background
const PALETTE = [
  '#BB86FC', // violet  (primary)
  '#03DAC5', // teal    (secondary)
  '#4fc3f7',
  '#81c784',
  '#ffb74d',
  '#e57373',
  '#f48fb1',
  '#fff176',
  '#90a4ae',
  '#ff8a65',
]

const BAUD_RATES = [4800, 9600, 19200, 38400, 57600, 115200]

interface Point { ts: number; value: number }
interface TagRange { min: number; max: number }

const norm = (val: number, lo: number, hi: number): number =>
  lo === hi ? 0.5 : (val - lo) / (hi - lo)

const formatTs = (ts: number): string => {
  const d = new Date(ts)
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + ms
}

const PlotterPage: React.FC = () => {
  const [baudRate, setBaudRate] = useState(9600)
  const [windowSecs, setWindowSecs] = useState(30)
  const [tagCount, setTagCount] = useState(0)

  // canvas + container
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  // data lives in refs so the RAF loop always reads the latest without causing re-renders
  const dataRef = useRef<Map<string, Point[]>>(new Map())
  const rangesRef = useRef<Map<string, TagRange>>(new Map())
  const orderRef = useRef<string[]>([]) // keeps insertion order for stable palette assignment
  const windowRef = useRef(windowSecs)
  windowRef.current = windowSecs

  // mouse position for hover tooltip
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  // Electron-only port picker dialog
  // on web, requestPort() shows the browser's native picker instead
  const [portPickerPorts, setPortPickerPorts] = useState<Array<{ portId: string; portName: string; displayName?: string }> | null>(null)
  const [selectedPortId, setSelectedPortId] = useState('')

  // listen for the port list sent by the main process after requestPort() is called
  useEffect(() => {
    if (!window.api?.onPortList) return
    window.api.onPortList((ports) => {
      setPortPickerPorts(ports)
      setSelectedPortId(ports[0]?.portId ?? '')
    })
  }, [])

  const confirmPort = () => {
    window.api.selectPort(selectedPortId)
    setPortPickerPorts(null)
  }

  const cancelPort = () => {
    window.api.selectPort('') // empty string = cancel
    setPortPickerPorts(null)
  }

  // incoming serial data
  const handleData = useCallback((rows: ParsedSerialRow[]) => {
    let newTag = false
    for (const { tag, value, timestamp } of rows) {
      if (!dataRef.current.has(tag)) {
        dataRef.current.set(tag, [])
        rangesRef.current.set(tag, { min: value, max: value })
        orderRef.current.push(tag)
        newTag = true
      }
      dataRef.current.get(tag)!.push({ ts: timestamp, value })
      const r = rangesRef.current.get(tag)!
      if (value < r.min) r.min = value
      if (value > r.max) r.max = value
    }
    if (newTag) setTagCount(orderRef.current.length)
  }, [])

  const { status, errorMsg, log, connect, disconnect, isSupported } = useSerial({ onData: handleData })
  const connected = status === 'connected'
  const [showLog, setShowLog] = useState(false)

  const clearData = useCallback(() => {
    dataRef.current.clear()
    rangesRef.current.clear()
    orderRef.current = []
    setTagCount(0)
  }, [])

  // canvas render loop - runs at ~60fps via requestAnimationFrame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) {
      rafRef.current = requestAnimationFrame(renderFrame)
      return
    }

    // resize canvas to match container
    const { width, height } = container.getBoundingClientRect()
    const W = Math.floor(width)
    const H = Math.floor(height)
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
    }
    if (W < 80 || H < 80) {
      rafRef.current = requestAnimationFrame(renderFrame)
      return
    }

    const ctx = canvas.getContext('2d')!
    const win = windowRef.current

    const ML = 54  // left margin for y-axis labels
    const MR = 16
    const MT = 16
    const MB = 46  // bottom margin for x-axis labels
    const PW = W - ML - MR
    const PH = H - MT - MB

    const now = Date.now()
    const cutoff = now - win * 1000

    // background
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(ML, MT, PW, PH)

    // grid lines at 0, 0.25, 0.5, 0.75, 1
    ctx.strokeStyle = '#242424'
    ctx.lineWidth = 0.5
    for (let v = 0; v <= 4; v++) {
      const cy = MT + PH * (1 - v / 4)
      ctx.beginPath()
      ctx.moveTo(ML, cy)
      ctx.lineTo(ML + PW, cy)
      ctx.stroke()
    }

    // y-axis labels
    ctx.fillStyle = '#555555'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let v = 0; v <= 4; v++) {
      ctx.fillText((v / 4).toFixed(2), ML - 6, MT + PH * (1 - v / 4))
    }

    // draw each channel
    const tags = orderRef.current
    for (let ti = 0; ti < tags.length; ti++) {
      const tag = tags[ti]
      const pts = dataRef.current.get(tag)!
      const range = rangesRef.current.get(tag)!

      // prune data outside the rolling window
      while (pts.length > 0 && pts[0].ts < cutoff) pts.shift()
      if (pts.length < 2) continue

      ctx.strokeStyle = PALETTE[ti % PALETTE.length]
      ctx.lineWidth = 1.6
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      let first = true
      for (const { ts, value } of pts) {
        const x = ML + ((ts - cutoff) / (win * 1000)) * PW
        const y = MT + PH * (1 - norm(value, range.min, range.max))
        if (first) { ctx.moveTo(x, y); first = false }
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // axes
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(ML, MT + PH); ctx.lineTo(ML + PW, MT + PH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ML, MT); ctx.lineTo(ML, MT + PH); ctx.stroke()

    // x-axis tick labels
    ctx.fillStyle = '#555555'
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 5; i++) {
      const frac = i / 5
      ctx.fillText(formatTs(cutoff + frac * win * 1000), ML + frac * PW, MT + PH + 6)
    }

    // legend
    if (tags.length > 0) {
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      let lx = ML + 10
      let ly = MT + 8
      for (let ti = 0; ti < tags.length; ti++) {
        const color = PALETTE[ti % PALETTE.length]
        const tag = tags[ti]
        ctx.fillStyle = 'rgba(26,26,26,0.85)'
        ctx.fillRect(lx - 2, ly - 2, tag.length * 7 + 22, 16)
        ctx.fillStyle = color
        ctx.fillRect(lx, ly + 4, 12, 3)
        ctx.fillStyle = '#cccccc'
        ctx.fillText(tag, lx + 16, ly)
        ly += 20
      }
    }

    // y-axis rotated label
    ctx.save()
    ctx.translate(12, MT + PH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#444444'
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('Normalised  (0 = min seen,  1 = max seen)', 0, 0)
    ctx.restore()

    // hover tooltip
    if (mouseRef.current && tags.length > 0) {
      const { x: mx, y: my } = mouseRef.current
      const px = mx - ML
      const py = my - MT

      if (px >= 0 && px <= PW && py >= 0 && py <= PH) {
        const hoverTs = cutoff + (px / PW) * win * 1000
        const toleranceMs = win * 150

        type Row = { tag: string; value: number; dist: number; range: TagRange }
        const rows: Row[] = []
        for (const tag of tags) {
          const pts = dataRef.current.get(tag)!
          if (pts.length === 0) continue
          const nearest = pts.reduce((a, b) =>
            Math.abs(a.ts - hoverTs) < Math.abs(b.ts - hoverTs) ? a : b
          )
          const dist = Math.abs(nearest.ts - hoverTs)
          if (dist <= toleranceMs)
            rows.push({ tag, value: nearest.value, dist, range: rangesRef.current.get(tag)! })
        }

        if (rows.length > 0) {
          rows.sort((a, b) => a.dist - b.dist)
          const FONT_SZ = 11
          const LINE_H = FONT_SZ + 5
          const PAD = 8
          const lines = [
            `@ ${formatTs(hoverTs)}`,
            ...rows.map(r => `  ${r.tag}: ${r.value.toFixed(4)}   [${r.range.min.toFixed(3)} – ${r.range.max.toFixed(3)}]`)
          ]
          const boxW = Math.max(...lines.map(l => l.length)) * FONT_SZ * 0.6 + PAD * 2
          const boxH = lines.length * LINE_H + PAD * 2

          let tx = mx + 16
          let ty = my + 16
          if (tx + boxW > W) tx = mx - boxW - 8
          if (ty + boxH > H) ty = my - boxH - 8
          if (tx < 0) tx = 4
          if (ty < 0) ty = 4

          ctx.fillStyle = 'rgba(20,20,20,0.95)'
          ctx.strokeStyle = '#555555'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.roundRect(tx, ty, boxW, boxH, 4)
          ctx.fill()
          ctx.stroke()

          ctx.font = `${FONT_SZ}px "JetBrains Mono", monospace`
          ctx.textBaseline = 'top'
          ctx.textAlign = 'left'
          lines.forEach((line, i) => {
            if (i === 0) ctx.fillStyle = '#cccccc'
            else ctx.fillStyle = PALETTE[orderRef.current.indexOf(rows[i - 1].tag) % PALETTE.length]
            ctx.fillText(line, tx + PAD, ty + PAD + i * LINE_H)
          })
        }
      }
    }

    rafRef.current = requestAnimationFrame(renderFrame)
  }, []) // no deps - reads everything from refs

  useEffect(() => {
    rafRef.current = requestAnimationFrame(renderFrame)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [renderFrame])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const onMouseLeave = useCallback(() => { mouseRef.current = null }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default', color: 'text.primary', overflow: 'hidden', p: 2, gap: 2 }}>

      {/* Electron port picker dialog
          on web this never shows - the browser handles port selection natively */}
      <Dialog
        open={portPickerPorts !== null}
        onClose={cancelPort}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' } }}
      >
        <DialogTitle sx={{ color: 'primary.main', fontFamily: 'monospace' }}>
          Select Serial Port
        </DialogTitle>
        <DialogContent>
          {portPickerPorts?.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
              No serial ports found. Make sure your device is plugged in.
              {navigator.userAgent.includes('Linux') && (
                <> On Linux you may need to run: <code style={{ color: '#BB86FC' }}>sudo usermod -a -G dialout $USER</code> then log out and back in.</>
              )}
            </Typography>
          ) : (
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel sx={{ color: 'text.secondary' }}>Port</InputLabel>
              <Select
                value={selectedPortId}
                onChange={(e) => setSelectedPortId(e.target.value)}
                label="Port"
                sx={{ color: 'text.primary' }}
              >
                {portPickerPorts?.map((p) => (
                  <MenuItem key={p.portId} value={p.portId} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {p.portName}{p.displayName ? ` — ${p.displayName}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPort} sx={{ color: 'text.secondary' }}>Cancel</Button>
          {portPickerPorts && portPickerPorts.length > 0 && (
            <Button onClick={confirmPort} variant="contained" disabled={!selectedPortId}>
              Connect
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* controls bar */}
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#1a1a1a', borderColor: 'divider', flexShrink: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>

          <Chip
            icon={connected ? <UsbIcon sx={{ fontSize: 14 }} /> : <UsbOffIcon sx={{ fontSize: 14 }} />}
            label={status}
            size="small"
            sx={{
              bgcolor: connected ? 'rgba(3,218,197,0.12)' : status === 'error' ? 'rgba(207,102,121,0.12)' : 'rgba(255,255,255,0.06)',
              color: connected ? 'secondary.main' : status === 'error' ? 'error.main' : 'text.primary',
              border: '1px solid',
              borderColor: connected ? 'secondary.main' : status === 'error' ? 'error.main' : 'divider',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          />

          <FormControl size="small" sx={{ minWidth: 115 }}>
            <InputLabel sx={{ color: 'text.secondary', fontSize: '12px' }}>Baud</InputLabel>
            <Select
              value={baudRate}
              label="Baud"
              onChange={(e) => setBaudRate(+e.target.value)}
              disabled={connected}
              sx={{ color: 'text.primary', fontSize: '12px' }}
            >
              {BAUD_RATES.map((b) => (
                <MenuItem key={b} value={b} sx={{ fontSize: '12px' }}>{b}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Window (s)"
            type="number"
            value={windowSecs}
            onChange={(e) => setWindowSecs(Math.max(1, +e.target.value))}
            size="small"
            sx={{ width: 100, '& input': { color: 'text.primary', fontSize: '12px' }, '& label': { fontSize: '12px' } }}
            inputProps={{ min: 1 }}
          />

          {!isSupported ? (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              Web Serial not supported — use Chrome, Edge, or Electron
            </Typography>
          ) : (
            <Button
              variant={connected ? 'outlined' : 'contained'}
              size="small"
              color={connected ? 'error' : 'primary'}
              startIcon={connected ? <UsbOffIcon /> : <UsbIcon />}
              onClick={connected ? disconnect : () => connect(baudRate)}
              disabled={status === 'connecting'}
              sx={{ fontSize: '12px' }}
            >
              {connected ? 'Disconnect' : status === 'connecting' ? 'Connecting…' : 'Connect'}
            </Button>
          )}

          {tagCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={clearData}
              sx={{ fontSize: '12px', borderColor: 'divider', color: 'text.secondary' }}
            >
              Clear
            </Button>
          )}

          {tagCount > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
              {tagCount} channel{tagCount !== 1 ? 's' : ''}
            </Typography>
          )}

          {/* debug log toggle - always visible so you can see what connect is doing */}
          <Button
            size="small"
            startIcon={<BugReportIcon sx={{ fontSize: 14 }} />}
            onClick={() => setShowLog((v) => !v)}
            sx={{
              ml: 'auto',
              fontSize: '11px',
              color: showLog ? 'primary.main' : 'text.secondary',
              borderColor: 'divider',
              textTransform: 'none',
            }}
            variant="outlined"
          >
            {log.length > 0 ? `Log (${log.length})` : 'Log'}
          </Button>
        </Stack>

        {errorMsg && (
          <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '11px' }}>{errorMsg}</Alert>
        )}

        {/* connection log - shows step-by-step what connect() is doing */}
        {showLog && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: '#0d0d0d',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              maxHeight: 140,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          >
            {log.length === 0 ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.5 }}>
                No log entries yet — click Connect to see what happens.
              </Typography>
            ) : (
              log.map((entry, i) => (
                <Box
                  key={i}
                  sx={{
                    color: entry.includes('ERROR') ? 'error.main' : entry.includes('Connected') ? 'secondary.main' : 'text.secondary',
                    lineHeight: 1.6,
                    opacity: i === 0 ? 1 : Math.max(0.35, 1 - i * 0.07),
                  }}
                >
                  {entry}
                </Box>
              ))
            )}
          </Box>
        )}
      </Paper>

      {/* canvas */}
      <Box
        ref={containerRef}
        sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {tagCount === 0 && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, pointerEvents: 'none' }}>
            <UsbIcon sx={{ fontSize: 44, color: 'divider' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.45 }}>
              {connected ? 'Waiting for data…' : 'Connect a device to start plotting'}
            </Typography>
            {connected && (
              <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.3, fontFamily: 'monospace' }}>
                Expected format: tag1: value1, tag2: value2
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.4, textAlign: 'center', flexShrink: 0, pb: 0.5 }}>
        Arduino:{' '}
        <code style={{ color: '#BB86FC' }}>
          Serial.println(&quot;tag1: &quot; + String(val1) + &quot;, tag2: &quot; + String(val2));
        </code>
      </Typography>
    </Box>
  )
}

export default PlotterPage
