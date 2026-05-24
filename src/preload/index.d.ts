import { ElectronAPI } from '@electron-toolkit/preload'

interface AppAPI {
  getVersion: () => Promise<string>
  onUpdateAvailable: (cb: () => void) => void
  onUpdateDownloaded: (cb: () => void) => void
  installUpdate: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
