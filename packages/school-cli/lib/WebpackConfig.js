const Config = require('webpack-chain');
const fs = require('fs');
const path = require('path');
const init = require('./initWebpack');
const projectUtil = require('./utils');

class WebpackConfig {
  constructor() {
    this.config = new Config();
    this.imports = [];
  }

  async init() {
    return await init(this);
  }

  getConfig() {
    return this.config;
  }

  addImports(imports = []) {
    this.imports = [...this.imports, ...imports];
  }

  cleanPlaceholder(str) {
    return str.replace(/.<<<|>>>./g, '');
  }
  __transformImports() {
    return this.imports
      .map(ipt => {
        let __import = null;
        let spreadName = null;
        if (ipt.spreadNames) {
          spreadName = `{${ipt.spreadNames.join(',')}}`;
        }

        if (ipt.name) {
          __import = ipt.name;
          if (spreadName) {
            __import = `${__import}, ${spreadName}`;
          }
        } else {
          __import = spreadName;
        }
        if (__import) {
          return `const ${__import} = require('${ipt.packageName}')`;
        }
        return `const ${this.__resolveName(ipt.packageName)} = require('${ipt.packageName}')`;
      })
      .join('\n\r')
      .concat('\n\r');
  }
  __resolveName(packageName) {
    const plugin = projectUtil.load(packageName, process.cwd());
    return plugin.__expression ? `(${plugin.__expression})` : plugin.name;
  }
  finalizeFile(dir) {
    const __imports = this.__transformImports();
    const __config = this.cleanPlaceholder(Config.toString(this.config.toConfig(), { verbose: true }));
    const __path = path.join(dir, 'webpack.dev.config.js');
    fs.writeFileSync(__path, `${__imports} module.exports = ${__config}`, 'utf8');
  }
}

module.exports = WebpackConfig;
