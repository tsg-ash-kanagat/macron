/**
 * Build config for development electron renderer process that uses
 * Hot-Module-Replacement
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const chalk = require('chalk');
const { spawn, execSync } = require('child_process');
const { TypedCssModulesPlugin } = require('typed-css-modules-webpack-plugin');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base');
const CheckNodeEnv = require('../internals/scripts/CheckNodeEnv');

if (process.env.NODE_ENV === 'production') {
  CheckNodeEnv('development');
}

const port = process.env.PORT || 1212;
const publicPath = `http://localhost:${port}/dist`;
const dll = path.join(__dirname, '..', 'dll');
const manifest = path.resolve(dll, 'renderer.json');
const requiredByDLLConfig =
  module.parent &&
  module.parent.filename &&
  module.parent.filename.includes('webpack.config.renderer.dev.dll');

if (!requiredByDLLConfig && !(fs.existsSync(dll) && fs.existsSync(manifest))) {
  console.log(
    chalk.black.bgYellow.bold(
      'The DLL files are missing. Sit back while we build them for you with "yarn build-dll"'
    )
  );
  execSync('yarn build-dll');
}

module.exports = merge(baseConfig, {
  devtool: 'inline-source-map',
  mode: 'development',
  target: 'electron-renderer',
  entry: [
    ...(process.env.PLAIN_HMR ? [] : ['react-hot-loader/patch']),
    `webpack-dev-server/client?http://localhost:${port}/`,
    'webpack/hot/only-dev-server',
    require.resolve('../app/index.tsx')
  ],
  output: {
    publicPath: `http://localhost:${port}/dist/`,
    filename: 'renderer.dev.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        resourceQuery: /url/,
        type: 'asset/resource'
      },
      {
        test: /\.global\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /^((?!\\.global).)*\\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          }
        ]
      },
      {
        test: /\\.global\\.(scss|sass)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /^((?!\\.global).)*\\.(scss|sass)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\\.woff(\\?v=\\d+\\.\\d+\\.\\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      {
        test: /\\.woff2(\\?v=\\d+\\.\\d+\\.\\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      {
        test: /\\.ttf(\\?v=\\d+\\.\\d+\\.\\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream'
          }
        }
      },
      {
        test: /\\.eot(\\?v=\\d+\\.\\d+\\.\\d+)?$/,
        use: 'file-loader'
      },
      {
        test: /\\.svg(\\?v=\\d+\\.\\d+\\.\\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'image/svg+xml'
          }
        }
      },
      {
        test: /\\.(?:ico|gif|png|jpg|jpeg|webp)$/,
        use: 'url-loader'
      }
    ]
  },
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom'
    }
  },
  plugins: [
    requiredByDLLConfig
      ? null
      : new webpack.DllReferencePlugin({
          context: path.join(__dirname, '..', 'dll'),
          manifest: require(manifest),
          sourceType: 'var'
        }),
    new webpack.HotModuleReplacementPlugin(),
    new TypedCssModulesPlugin({
      globPattern: 'app/**/*.{css,scss,sass}'
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ].filter(Boolean),
  node: {
    __dirname: false,
    __filename: false
  },
  devServer: {
    port,
    hot: true,
    compress: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    devMiddleware: {
      publicPath
    },
    static: {
      directory: path.join(__dirname, '..', 'app'),
      publicPath: '/'
    },
    historyApiFallback: true,
    setupMiddlewares: (middlewares, server) => {
      if (process.env.START_HOT) {
        console.log('Starting Main Process...');
        spawn('yarn', ['start-main-dev'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
          .on('close', code => process.exit(code))
          .on('error', spawnError => console.error(spawnError));
      }
      return middlewares;
    }
  }
});
