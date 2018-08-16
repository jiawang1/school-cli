const Config = require('webpack-chain');
const fs = require('fs');
const path = require('path');
const init = require('./initWebpack');


class WebpackConfig {
  constructor() {
    this.config = new Config();
    this.imports = [];
    init(this);
  }

  getConfig(){
    return this.config;
  }

  addImports(imports = []){
    this.imports = [...this.imports, ...imports];
  }

  __transformImports() {
    return this.imports.map(
      ipt =>
        `const ${ipt.name ? ipt.name : this.__resolveName(ipt.packageName)} = require('${ipt.packageName}')`
    ).join('\n\r').concat('\n\r');
  }
  __resolveName(packageName) {
    const plugin = require(packageName);
    return plugin.__expression ? `(${plugin.__expression})` : plugin.name;
  }
  finalizeFile(dir) {
    const __imports = this.__transformImports();
    const __config = Config.toString(this.config.toConfig(), { verbose: true });
    const __path = path.join(dir, 'webpack.dev.config.js');
    fs.writeFileSync(__path, `${__imports} module.exports = ${__config}`, 'utf8');
  }
}

module.exports = WebpackConfig;
