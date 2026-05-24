import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

// held so the serial:select-port IPC can resolve it later
let _portSelectCallback: ((portId: string) => void) | null = null

// auto updater setup - only runs in prod, dev builds have no feed
function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', () => mainWindow.webContents.send('update:available'))
  autoUpdater.on('update-downloaded', () => mainWindow.webContents.send('update:downloaded'))
  autoUpdater.on('error', (err) => console.error('[updater]', err.message))

  if (!is.dev) autoUpdater.checkForUpdatesAndNotify()
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // web serial setup
  // all three handlers use the same session object so there's no mismatch
  const ses = mainWindow.webContents.session

  // when requestPort() is called in the renderer, Electron intercepts here instead
  // of showing the browser's default picker. we forward the port list to the renderer
  // so it can show its own dropdown dialog and send back the chosen portId.
  ses.on('select-serial-port', (event, portList, _wc, callback) => {
    event.preventDefault()
    _portSelectCallback = callback
    mainWindow.webContents.send('serial:port-list', portList)
  })

  ses.setPermissionCheckHandler((_wc, permission) => permission === 'serial')
  ses.setDevicePermissionHandler((details) => details.deviceType === 'serial')

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    setupAutoUpdater(mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// renderer sends back the portId it wants (or '' to cancel)
ipcMain.handle('serial:select-port', (_event, portId: string) => {
  _portSelectCallback?.(portId)
  _portSelectCallback = null
})

ipcMain.handle('app:version', () => app.getVersion())
ipcMain.on('update:install', () => autoUpdater.quitAndInstall())

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.aps.sw-tools')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
