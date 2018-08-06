const chalk = require('chalk');
const fs = require('fs');

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

module.exports = {
  error,
  log,
  deleteFolder
};
