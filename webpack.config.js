/* global __dirname */
var path = require('path');

module.exports = {
  entry: './app.js',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  resolveLoader: { root: path.join(__dirname, 'node_modules') },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!transmitter-framework)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: [
            'transform-runtime',
            'transform-class-properties',
            'transform-export-extensions'
          ]
        }
      }
    ]
  }
};
