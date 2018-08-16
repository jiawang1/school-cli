const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const resilveFrom = (_module, fromDir) => {
  const Module = require('module');
  return Module._findPath(_module, [path.join(fromDir, '/node_modules')], false);
};

const load = (_module, fromDir) => {
  const filename = resilveFrom(_module, fromDir);
  return require(filename);
};

const error = (...args) => {
  console.log(chalk.red(...args));
};

const log = (...args) => {
  console.log(chalk.green(...args));
};

const deleteFolder = path => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const mergeJSON = (a, b) => {
  Object.keys(b).forEach(k => {
    if (a[k]) {
      if (Array.isArray(a[k])) {
        if (!Array.isArray(b[k])) {
          throw new Error(`${k} in two object has different type`);
        }
        a[k] = [...a[k], ...b[k]];
        return;
      } else if (typeof a[k] === 'object') {
        if (typeof b[k] !== 'object') {
          throw new Error(`${k} in two object has different type`);
        }
        a[k] = mergeJSON(a[k], b[k]);
        return;
      }
    }
    a[k] = b[k];
  });
  return a;
};

module.exports = {
  error,
  log,
  deleteFolder,
  load,
  mergeJSON
};
