import { ElectronAPI } from '@electron-toolkit/preload'

interface SerialPortInfo {
  portId: string
  portName: string
  displayName?: string
}

interface AppAPI {
  getVersion: () => Promise<string>
  onUpdateAvailable: (cb: () => void) => void
  onUpdateDownloaded: (cb: () => void) => void
  installUpdate: () => void
  onPortList: (cb: (ports: SerialPortInfo[]) => void) => void
  selectPort: (portId: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
