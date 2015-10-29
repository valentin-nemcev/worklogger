module.exports = {
  entry: "./app.es",
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.(es|js)$/,
        exclude: /node_modules\/(?!transmitter-framework)/,
        loader: 'babel-loader',
        query: {
          optional: ['runtime', 'es7.exportExtensions', 'es7.classProperties'],
        }
      }
    ]
  }
};
