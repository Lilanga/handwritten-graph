const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'handwritten-graph.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'HandwrittenGraph',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',  // Converts CSS into JS
          'css-loader',    // Translates CSS into CommonJS
          'sass-loader'    // Compiles SCSS to CSS
        ],
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,  // Font file types
        type: 'asset/inline',  // Inline fonts as base64
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.scss'],
  },
};