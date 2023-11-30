module.exports = {
    // ... (other configuration settings)
    resolve: {
      extensions: [ '.tsx', '.ts', '.js', '.png' ],
      fallback: {
        "fs": false,
        "tls": false,
        "net": false,
        "path": false,
        "zlib": false,
        "http": false,
        "https": false,
        "stream": false,
        "crypto": false,
        "crypto-browserify": require.resolve('crypto-browserify'),
      },
    },
    // ... (other configuration settings)
  };