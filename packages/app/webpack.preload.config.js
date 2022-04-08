const path = require('path');

module.exports = {
  mode: 'production',
  entry: './dist/preload.js',
  target: 'electron-preload',
  output: {
    filename: 'preload.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
