const Config = require('webpack-chain');
const path = require('path');
const WebpackConfig = require('./WebpackConfig');

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
const webpackConfig = new Config();

webpackConfig
  .mode('development')
  .context('./src')
  .entry('app')
  .add('./src/main.js')
  .end()
  .output.path('/out')
  .filename('[name].js')
  .publicPath('/');

webpackConfig.module
  .rule('svg')
  .test(/\.(svg)(\?.*)?$/)
  .use('file-loader')
  .loader('file-loader')
  .options({
    name: genAssetSubPath('img')
  });

webpackConfig.module
  .rule('fonts')
  .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
  .use('url-loader')
  .loader('url-loader')
  .options({
    limit: inlineLimit,
    name: genAssetSubPath('fonts')
  });

webpackConfig.module
  .rule('fonts')
  .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
  .use('url-loader')
  .loader('url-loader')
  .options({
    limit: inlineLimit,
    name: getAssetPath('fonts')
  });

webpackConfig.plugin('hmr').use(require('webpack/lib/HotModuleReplacementPlugin'));

const HTMLPlugin = require('html-webpack-plugin');
webpackConfig.plugin('html').use(HTMLPlugin, [
  {
    inject: true,
    fileName: 'index.html',
    template: `./index.ejs`
  }
]);

const oCon = new WebpackConfig([{packageName:'html-webpack-plugin'}], webpackConfig);
oCon.finalizeFile(__dirname);

// console.log(HTMLPlugin.name);

// console.log(Config.toString(webpackConfig.toConfig(), { verbose: true }));
