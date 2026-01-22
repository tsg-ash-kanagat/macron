/* eslint global-require: off, import/no-extraneous-dependencies: off */

const developmentEnvironments = ['development', 'test'];

const developmentPlugins = [require('react-hot-loader/babel')];

const productionPlugins = [
  require('babel-plugin-dev-expression'),
  require('@babel/plugin-transform-react-constant-elements'),
  require('@babel/plugin-transform-react-inline-elements'),
  require('babel-plugin-transform-react-remove-prop-types')
];

module.exports = api => {
  const development = api.env(developmentEnvironments);

  return {
    presets: [
      require('@babel/preset-env'),
      require('@babel/preset-typescript'),
      [require('@babel/preset-react'), { development }]
    ],
    plugins: [
      [require('@babel/plugin-proposal-decorators'), { legacy: true }],
      [require('@babel/plugin-proposal-class-properties'), { loose: true }],
      require('@babel/plugin-proposal-optional-chaining'),
      require('@babel/plugin-proposal-nullish-coalescing-operator'),
      ...(development ? developmentPlugins : productionPlugins)
    ]
  };
};
