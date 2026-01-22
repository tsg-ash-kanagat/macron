import { app as electron } from 'electron';
const pkg = require('../package.json');

let remote;
if (process.type === 'renderer') {
  remote = require('@electron/remote/renderer');
}


export const appPath = dir => {
  return (
    (process.env.NODE_ENV === 'development' ? `${__dirname}/..` : __dirname) +
    (dir ? `/${dir}` : '')
  );
};

export const app = () => electron || remote.app;

export const version = () => pkg.version;
