module.exports = {
  entry: "./app.es",
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.es$/,
        exclude: /(node_modules)/,
        loader: 'babel'
      }
    ]
  }
};
