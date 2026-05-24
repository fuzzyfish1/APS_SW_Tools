// Web Serial API hook
// works in Chrome/Edge (web) and Electron via the same navigator.serial surface
//
// arduino output format:   tag1: value1, tag2: value2\n

import { useState, useCallback, useRef, useEffect } from 'react'

// type shims - Web Serial isn't in the TS lib yet
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

// VID filters for common arduino/microcontroller USB-serial chips
// only used when useFilters=true is passed to connect()
export const ARDUINO_FILTERS = [
  { usbVendorId: 0x2341 }, // Arduino LLC
  { usbVendorId: 0x2a03 }, // Arduino (newer)
  { usbVendorId: 0x1a86 }, // CH340 / CH341 (super common on clones)
  { usbVendorId: 0x0403 }, // FTDI FT232
  { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
  { usbVendorId: 0x067b }, // Prolific PL2303
]

interface UseSerialOptions {
  onData?: (rows: ParsedSerialRow[]) => void
}

export function useSerial({ onData }: UseSerialOptions = {}) {
  const [status, setStatus] = useState<SerialStatus>('disconnected')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const onDataRef = useRef(onData)
  onDataRef.current = onData

  const isSupported = typeof navigator !== 'undefined' && 'serial' in navigator

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setLog((prev) => [`[${ts}] ${msg}`, ...prev.slice(0, 99)])
  }, [])

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
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const rows = parseSerialLine(line.trim())
          if (rows.length > 0) onDataRef.current?.(rows)
        }
      }
    } catch {
      // cancelled on disconnect - not an error
    } finally {
      try { readerRef.current?.releaseLock() } catch { /* ignore */ }
      readerRef.current = null
    }
  }, [])

  // useFilters defaults to false - show all USB serial ports.
  // pass true to narrow the picker to known arduino VIDs only.
  // (false is safer for clone boards with uncommon VIDs)
  const connect = useCallback(
    async (baudRate = 9600, useFilters = false) => {
      if (!isSupported) {
        const msg = 'Web Serial API not available. Use Chrome, Edge, or the desktop app.'
        addLog('ERROR: ' + msg)
        setErrorMsg(msg)
        setStatus('error')
        return
      }

      try {
        setStatus('connecting')
        setErrorMsg(null)
        addLog(`Calling requestPort() — showing ${useFilters ? 'filtered (arduino VIDs only)' : 'all USB serial'} ports…`)

        const port = await navigator.serial.requestPort(
          useFilters ? { filters: ARDUINO_FILTERS } : {}
        )

        addLog(`Port selected. Opening at ${baudRate} baud…`)
        await port.open({ baudRate })

        portRef.current = port
        setStatus('connected')
        addLog(`Connected at ${baudRate} baud. Waiting for data…`)

        startReadLoop(port).then(() => {
          setStatus('disconnected')
          addLog('Port closed / disconnected.')
        })
      } catch (err: unknown) {
        const e = err as DOMException
        // NotFoundError = user closed the picker (cancelled) or no matching ports found
        if (e?.name === 'NotFoundError' || e?.name === 'AbortError') {
          addLog('Port selection cancelled (or no matching ports in picker).')
          setStatus('disconnected')
        } else {
          const msg = (err as Error)?.message ?? 'Unknown error'
          addLog(`ERROR: ${e?.name ?? 'Unknown'} — ${msg}`)
          setErrorMsg(`${e?.name ? e.name + ': ' : ''}${msg}`)
          setStatus('error')
        }
      }
    },
    [isSupported, startReadLoop, addLog]
  )

  const disconnect = useCallback(async () => {
    addLog('Disconnecting…')
    try { await readerRef.current?.cancel() } catch { /* ignore */ }
    readerRef.current = null
    try { await portRef.current?.close() } catch { /* ignore */ }
    portRef.current = null
    setStatus('disconnected')
    setErrorMsg(null)
    addLog('Disconnected.')
  }, [addLog])

  // cleanup on unmount
  useEffect(() => () => { disconnect() }, [disconnect])

  return { status, errorMsg, log, connect, disconnect, isSupported }
}
