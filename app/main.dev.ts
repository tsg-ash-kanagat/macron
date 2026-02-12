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
import * as remote from '@electron/remote/main/index.js';
remote.initialize();
import store from './utils/store.js';

store.set('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

let mainWindow: BrowserWindow | null = null;

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
      webSecurity: process.env.NODE_ENV !== 'development',
      allowRunningInsecureContent: process.env.NODE_ENV === 'development'
    }
  });

  remote.enable(mainWindow.webContents);

  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    mainWindow.loadURL(`http://localhost:${port}/app.html`);
  } else {
    const htmlPath = path.join(__dirname, 'app.html');
    mainWindow.loadFile(htmlPath);
  }

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
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
