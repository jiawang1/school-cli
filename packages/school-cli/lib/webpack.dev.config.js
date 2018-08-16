const HtmlWebpackPlugin = require('html-webpack-plugin')
 module.exports = {
  mode: 'development',
  context: './src',
  output: {
    path: '/out',
    filename: '[name].js',
    publicPath: '/'
  },
  module: {
    rules: [
      /* config.module.rule('svg') */
      {
        test: /\.(svg)(\?.*)?$/,
        use: [
          /* config.module.rule('svg').use('file-loader') */
          {
            loader: 'file-loader',
            options: {
              name: 'img/[name].[hash:8].[ext]'
            }
          }
        ]
      },
      /* config.module.rule('fonts') */
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        use: [
          /* config.module.rule('fonts').use('url-loader') */
          {
            loader: 'url-loader',
            options: {
              limit: 4096,
              name: undefined
            }
          }
        ]
      }
    ]
  },
  plugins: [
    /* config.plugin('hmr') */
    new HotModuleReplacementPlugin(),
    /* config.plugin('html') */
    new HtmlWebpackPlugin(
      {
        inject: true,
        fileName: 'index.html',
        template: './index.ejs'
      }
    )
  ],
  entry: {
    app: [
      './src/main.js'
    ]
  }
}