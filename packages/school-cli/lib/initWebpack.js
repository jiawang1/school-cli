const path = require('path');

function getAssetPath(options, filePath, placeAtRootIfRelative) {
  // if the user is using a relative URL, place js & css at dist root to ensure
  // relative paths work properly
  if (placeAtRootIfRelative && !/^https?:/.test(options.baseUrl) && options.baseUrl.charAt(0) !== '/') {
    return filePath.replace(/^\w+\//, '');
  }
  return options.assetsDir ? path.posix.join(options.assetsDir, filePath) : filePath;
}

const genAssetSubPath = dir => {
  return getAssetPath({}, `${dir}/[name].[hash:8].[ext]`);
};

const inlineLimit = 4096;

const init = webpackconfig => {
  const config = webpackconfig.getConfig();
  const imports = [];
  config
    .mode('development')
    .context('./src')
    .entry('app')
    .add('./src/main.js')
    .end()
    .output.path('/out')
    .filename('[name].js')
    .publicPath('/');

  config.module
    .rule('svg')
    .test(/\.(svg)(\?.*)?$/)
    .use('file-loader')
    .loader('file-loader')
    .options({
      name: genAssetSubPath('img')
    });

  config.module
    .rule('fonts')
    .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
    .use('url-loader')
    .loader('url-loader')
    .options({
      limit: inlineLimit,
      name: genAssetSubPath('fonts')
    });

  config.module
    .rule('fonts')
    .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
    .use('url-loader')
    .loader('url-loader')
    .options({
      limit: inlineLimit,
      name: getAssetPath('fonts')
    });

  config.devtool('inline-source-map');
  config.cache(true);

  config.devServer
    .contentBase()
    .allowedHosts(['localhost'])
    .hot(true)
    .noInfo(false)
    .publicPath()
    .filename('index.html');

  imports.push({ packageName: 'webpack', name: 'webpack' });
  imports.push({ packageName: 'html-webpack-plugin' });
  config.plugin('hmr').use(require('webpack/lib/HotModuleReplacementPlugin'));

  const HTMLPlugin = require('html-webpack-plugin');
  config.plugin('html').use(HTMLPlugin, [
    {
      inject: true,
      fileName: 'index.html',
      template: `./index.ejs`
    }
  ]);

  config.plugin('define').use(require('webpack/lib/DefinePlugin'), [
    {
      'process.env': {
        NODE_ENV: "'development'"
      }
    }
  ]);

  webpackconfig.addImports(imports);
  return webpackconfig;
};

module.exports = init;
