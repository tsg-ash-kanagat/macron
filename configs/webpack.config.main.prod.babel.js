/**
 * Webpack config for production electron main process
 */

const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const baseConfig = require('./webpack.config.base');
const CheckNodeEnv = require('../internals/scripts/CheckNodeEnv');
const DeleteSourceMaps = require('../internals/scripts/DeleteSourceMaps');

CheckNodeEnv('production');
DeleteSourceMaps();

module.exports = merge(baseConfig, {
  devtool: process.env.DEBUG_PROD === 'true' ? 'source-map' : false,
  mode: 'production',
  target: 'electron-main',
  entry: './app/main.dev.ts',
  output: {
    path: path.join(__dirname, '..'),
    filename: './app/main.prod.js'
  },
  optimization: {
    minimizer: process.env.E2E_BUILD
      ? []
      : [
          new TerserPlugin({
            parallel: true,
            extractComments: false,
            terserOptions: {
              format: { comments: false }
            }
          })
        ]
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode:
        process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
      openAnalyzer: process.env.OPEN_ANALYZER === 'true'
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
      START_MINIMIZED: false,
      E2E_BUILD: false
    })
  ],
  node: {
    __dirname: false,
    __filename: false
  }
});
