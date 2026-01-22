const path = require('path');

// Configure Babel to transpile TypeScript to CommonJS
// @babel/register will automatically use babel.config.js, but we need to ensure CommonJS output
require('@babel/register')({
  extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
  cwd: path.join(__dirname, '..', '..'),
  ignore: [/node_modules/],
  only: [
    path.join(__dirname, '..', '..', 'app'),
    path.join(__dirname, '..', '..', 'internals'),
    path.join(__dirname, '..', '..', 'configs')
  ],
  // Force CommonJS modules to avoid ES module issues with Node.js v25
  presets: [
    ['@babel/preset-env', { modules: 'commonjs' }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { development: true }]
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    'react-hot-loader/babel'
  ]
});
