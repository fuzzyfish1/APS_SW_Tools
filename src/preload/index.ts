import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/** Typed surface exposed to the renderer under window.api */
const api = {
  /** Returns the Electron app version string, e.g. "3.0.0" */
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

  /** Register a callback for when an update is available for download. */
  onUpdateAvailable: (cb: () => void): void => {
    ipcRenderer.on('update:available', cb)
  },

  /** Register a callback for when an update has been downloaded and is ready. */
  onUpdateDownloaded: (cb: () => void): void => {
    ipcRenderer.on('update:downloaded', cb)
  },

  /** Tell the main process to quit and install the downloaded update. */
  installUpdate: (): void => {
    ipcRenderer.send('update:install')
  }
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
