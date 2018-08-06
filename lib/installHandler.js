const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const dgr = require('download-git-repo');
const { projectType, componentPackage } = require('./const');

const download = (source, target) => {
  return new Promise((res, rej) => {
    dgr(source, target, err => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    });
  });
};

class Handler {
  download(target) {
    return new Promise((res, rej) => {
      dgr(this.gitAddress, target, err => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  }
  generate(targetPath, data) {
    return Promise.all(
      this.fileList.map(__file => {
        return new Promise((res, rej) => {
          const file = path.join(targetPath, __file);
          ejs.renderFile(file, data, function(err, str) {
            if (err) {
              rej(err);
            }
            fs.writeFileSync(file, str);
            res();
          });
        });
      })
    );
  }
}

class ApplicationHandler extends Handler {
  constructor() {
    super();
    this.fileList = ['package.json', 'README.md'];
    this.gitAddress = 'jiawang1/template';
  }
}

class ComponentHandler extends Handler {
  constructor() {
    super();
    this.fileList = ['package.json', 'README.md'];
    this.gitAddress = 'jiawang1/template-component';
  }
  generate(targetPath, data) {
    super.generate(targetPath, data);
    const { componentName } = data;

    if (componentName) {
      const oldComponentPackagePath = path.join(targetPath, 'packages', componentPackage);
      const newComponentPackagePath = path.join(targetPath, 'packages', componentName);
      fs.renameSync(oldComponentPackagePath, newComponentPackagePath);
    }
  }
}

const applicationHanlder = new ApplicationHandler();
const componentHandler = new ComponentHandler();

const getHandler = templateType => {
  if (templateType === projectType.application) {
    return applicationHanlder;
  } else {
    return componentHandler;
  }
};

module.exports = getHandler;
