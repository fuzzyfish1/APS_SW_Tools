/**
 * useSerial — Web Serial API hook
 *
 * Works in Chrome/Edge (web) and Electron (desktop) because Electron has
 * supported the Web Serial API since v89.
 *
 * The Arduino must output lines in the format:
 *   tag1: value1, tag2: value2\n
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// ─── Web Serial API type shims ────────────────────────────────────────────────
// The Web Serial API is not yet in the TypeScript lib.  We declare only the
// surface that this hook actually uses so the rest of the codebase stays typed.

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface SerialOptions {
  baudRate: number
}

interface SerialPort {
  readable: ReadableStream<Uint8Array> | null
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
}

interface Serial {
  requestPort(options?: { filters?: SerialPortFilter[] }): Promise<SerialPort>
}

declare global {
  interface Navigator {
    readonly serial: Serial
  }
}

export type SerialStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ParsedSerialRow {
  tag: string
  value: number
  timestamp: number
}

/**
 * VID filters for common Arduino / microcontroller USB-serial chips.
 * Passing these to requestPort() limits the browser picker to known devices.
 */
export const ARDUINO_FILTERS = [
  { usbVendorId: 0x2341 }, // Arduino LLC
  { usbVendorId: 0x2a03 }, // Arduino (newer)
  { usbVendorId: 0x1a86 }, // CH340 / CH341 (common clone chips)
  { usbVendorId: 0x0403 }, // FTDI FT232
  { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
  { usbVendorId: 0x067b }  // Prolific PL2303
]

interface UseSerialOptions {
  onData?: (rows: ParsedSerialRow[]) => void
}

export function useSerial({ onData }: UseSerialOptions = {}) {
  const [status, setStatus] = useState<SerialStatus>('disconnected')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Keep refs so callbacks don't go stale
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const onDataRef = useRef(onData)
  onDataRef.current = onData

  const isSupported =
    typeof navigator !== 'undefined' && 'serial' in navigator

  // ── Parse a single serial line ─────────────────────────────────────────────
  const parseSerialLine = (line: string): ParsedSerialRow[] => {
    const now = Date.now()
    const result: ParsedSerialRow[] = []
    for (const seg of line.split(',')) {
      const trimmed = seg.trim()
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx < 0) continue
      const tag = trimmed.slice(0, colonIdx).trim()
      const val = parseFloat(trimmed.slice(colonIdx + 1).trim())
      if (tag && !isNaN(val)) result.push({ tag, value: val, timestamp: now })
    }
    return result
  }

  // ── Background read loop ───────────────────────────────────────────────────
  const startReadLoop = useCallback(async (port: SerialPort) => {
    const decoder = new TextDecoder()
    let buf = ''

    const reader = port.readable!.getReader() as ReadableStreamDefaultReader<Uint8Array>
    readerRef.current = reader
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        // Flush complete lines
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const rows = parseSerialLine(line.trim())
          if (rows.length > 0) onDataRef.current?.(rows)
        }
      }
    } catch {
      // Cancelled intentionally on disconnect — not an error worth surfacing
    } finally {
      try { readerRef.current?.releaseLock() } catch { /* ignore */ }
      readerRef.current = null
    }
  }, [])

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (baudRate = 9600, useFilters = true) => {
      if (!isSupported) {
        setErrorMsg(
          'Web Serial API is not available. Use Chrome or Edge (desktop or Electron).'
        )
        setStatus('error')
        return
      }

      try {
        setStatus('connecting')
        setErrorMsg(null)

        const port = await navigator.serial.requestPort(
          useFilters ? { filters: ARDUINO_FILTERS } : {}
        )
        await port.open({ baudRate })

        portRef.current = port
        setStatus('connected')

        // Read in the background; resolve when connection closes
        startReadLoop(port).then(() => {
          setStatus('disconnected')
        })
      } catch (err: unknown) {
        const e = err as DOMException
        if (e?.name === 'NotFoundError') {
          // User cancelled the picker — not an error
          setStatus('disconnected')
        } else {
          setErrorMsg((err as Error)?.message ?? 'Connection failed')
          setStatus('error')
        }
      }
    },
    [isSupported, startReadLoop]
  )

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try { await readerRef.current?.cancel() } catch { /* ignore */ }
    readerRef.current = null
    try { await portRef.current?.close() } catch { /* ignore */ }
    portRef.current = null
    setStatus('disconnected')
    setErrorMsg(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => { disconnect() }, [disconnect])

  return { status, errorMsg, connect, disconnect, isSupported }
}
