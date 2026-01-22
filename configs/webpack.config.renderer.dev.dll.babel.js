/**
 * Builds the DLL for development electron renderer process
 */

const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base');
const CheckNodeEnv = require('../internals/scripts/CheckNodeEnv');
const { dependencies } = require('../package.json');

CheckNodeEnv('development');

const dist = path.join(__dirname, '..', 'dll');

module.exports = merge(baseConfig, {
  context: path.join(__dirname, '..'),
  devtool: 'eval',
  mode: 'development',
  target: 'electron-renderer',
  externals: ['fsevents', 'crypto-browserify'],
  /**
   * Use `module` from `webpack.config.renderer.dev.js`
   */
  module: require('./webpack.config.renderer.dev.babel').module,
  entry: {
    renderer: Object.keys(dependencies || {})
  },
  output: {
    library: 'renderer',
    path: dist,
    filename: '[name].dev.dll.js',
    libraryTarget: 'var'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(dist, '[name].json'),
      name: '[name]'
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    new webpack.LoaderOptionsPlugin({
      debug: true,
      options: {
        context: path.join(__dirname, '..', 'app'),
        output: {
          path: path.join(__dirname, '..', 'dll')
        }
      }
    })
  ]
});
