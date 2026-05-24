import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

// ─── Auto-updater ────────────────────────────────────────────────────────────

function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update:available')
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater]', err.message)
  })

  // Only check in production — dev builds don't have a proper feed
  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify()
  }
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // ── Web Serial API ──────────────────────────────────────────────────────────
  // Grant serial-port access so the renderer can use navigator.serial directly.

  mainWindow.webContents.session.on(
    'select-serial-port',
    (event, portList, _webContents, callback) => {
      event.preventDefault()
      // The renderer shows its own port-picker UI, so the session event is
      // only fired when the browser's built-in chooser would pop up.
      // Auto-select the first available port as a fallback.
      callback(portList.length > 0 ? portList[0].portId : '')
    }
  )

  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return permission === 'serial'
  })

  session.defaultSession.setDevicePermissionHandler((details) => {
    return details.deviceType === 'serial'
  })
  // ─────────────────────────────────────────────────────────────────────────

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

// ─── IPC ─────────────────────────────────────────────────────────────────────

/** Renderer can ask for the running app version. */
ipcMain.handle('app:version', () => app.getVersion())

/** Renderer triggers the update install (called after update-downloaded). */
ipcMain.on('update:install', () => autoUpdater.quitAndInstall())

// ─── App lifecycle ───────────────────────────────────────────────────────────

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
