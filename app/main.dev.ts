/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, nativeTheme } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as remote from '@electron/remote/main/index.js';
remote.initialize();
import log from 'electron-log';
import store from './utils/store.js';

store.set('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configure auto-updater for security
    autoUpdater.autoDownload = false; // Manual download control
    autoUpdater.autoInstallOnAppQuit = true;

    // Handle update events with enhanced security
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      // Only download updates from official releases
      if (info.releaseType === 'release') {
        autoUpdater.downloadUpdate();
      } else {
        log.warn('Skipping non-release update:', info.releaseType);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded - signature verified by electron-updater');
      log.info('Update info:', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseName: info.releaseName,
        releaseNotes: info.releaseNotes
      });

      // electron-updater automatically verifies signatures on macOS
      // The update will only proceed if the signature is valid
      // Additional verification is handled by macOS code signing
      log.info('Update will be installed on next app restart');
    });

    // Check for updates
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.error('Update check failed:', err);
    });
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}


const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    // TODO: electron-debug v4 is ESM-only, causing loading issues in main process
    // Consider downgrading to v3 or properly configuring ESM support
    // const electronDebug = await import('electron-debug');
    // electronDebug.default();
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    height: 700,
    minHeight: 550,
    minWidth: 900,
    width: 1000,
    titleBarStyle: 'default',
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      // Development mode: disable web security to allow webpack dev server
      webSecurity: process.env.NODE_ENV !== 'development',
      allowRunningInsecureContent: process.env.NODE_ENV === 'development'
    }
  });

  remote.enable(mainWindow.webContents);

  // In development, load from webpack dev server
  // In production, load from file
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    mainWindow.loadURL(`http://localhost:${port}/app.html`);
  } else {
    const htmlPath = path.join(__dirname, 'app.html');
    mainWindow.loadFile(htmlPath);
  }

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.removeMenu();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  // Auto-update only when packaged to avoid dev crashes
  if (app.isPackaged) {
    try {
      // eslint-disable-next-line no-new
      new AppUpdater();
    } catch (err) {
      log.error('Failed to initialize auto-updater:', err);
    }
  }
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
