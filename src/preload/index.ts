import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

  onUpdateAvailable: (cb: () => void): void => {
    ipcRenderer.once('update:available', cb)
  },
  onUpdateDownloaded: (cb: () => void): void => {
    ipcRenderer.once('update:downloaded', cb)
  },
  installUpdate: (): void => {
    ipcRenderer.send('update:install')
  },

  // serial port picker - called when the main process intercepts requestPort()
  // and forwards the available port list. the renderer shows a dropdown and
  // responds with selectPort(portId) or selectPort('') to cancel.
  onPortList: (cb: (ports: Array<{ portId: string; portName: string; displayName?: string }>) => void): void => {
    ipcRenderer.on('serial:port-list', (_e, ports) => cb(ports))
  },
  selectPort: (portId: string): Promise<void> => ipcRenderer.invoke('serial:select-port', portId)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
