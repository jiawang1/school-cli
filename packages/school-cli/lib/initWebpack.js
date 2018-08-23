const path = require('path');
const util = require('util');
const exec = require('child_process').exec;
const execPromise = util.promisify(exec);
const projectUtil = require('./utils');

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
const dependencies = ['webpack', 'html-webpack-plugin'];

const init = async webpackconfig => {
  await execPromise(`npm install ${dependencies.join(' ')}`);
  const config = webpackconfig.getConfig();
  const imports = [];
  config
    .mode('development')
    .context('<<<`${process.cwd()}/src`>>>')
    .output.path('<<<`${process.cwd()}/_out`>>>')
    .filename('[name].js')
    .publicPath('/');

  config.module
    .rule('jsx')
    .test(/\.jsx?$/)
    .exclude.add(/node_modules/)
    .end()
    .use('babel-loader')
    .loader('babel-loader');

  const cssRule = config.module.rule('css').test(/\.css$/);

  cssRule.use('style-loader').loader('style-loader');
  cssRule.use('css-loader').loader('css-loader');

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
    .rule('images')
    .test(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/)
    .use('url-loader')
    .loader('url-loader')
    .options({
      limit: inlineLimit,
      name: genAssetSubPath('img')
    });

  config.devtool('inline-source-map');
  config.cache(true);

  config.devServer
    .contentBase('<<<`${process.cwd()}/src`>>>')
    .hot(true)
    .noInfo(false)
    .publicPath('/')
    .filename('index.html');

  config.devServer.allowedHosts.add('localhost');

  imports.push({ packageName: 'webpack', spreadNames: ['HotModuleReplacementPlugin', 'DefinePlugin'] });
  imports.push({ packageName: 'html-webpack-plugin' });
  config.plugin('hmr').use(projectUtil.load('webpack/lib/HotModuleReplacementPlugin', process.cwd()));

  const HTMLPlugin = projectUtil.load('html-webpack-plugin', process.cwd());
  config.plugin('html').use(HTMLPlugin, [
    {
      inject: true,
      fileName: 'index.html',
      template: '<<<`${process.cwd()}/public/index.ejs`>>>'
    }
  ]);

  config.plugin('define').use(projectUtil.load('webpack/lib/DefinePlugin', process.cwd()), [
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
