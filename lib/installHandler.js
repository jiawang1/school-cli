const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const dgr = require('download-git-repo');
const { projectType, componentTemplate } = require('./const');

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
  generate(targetPath, data, fileList = this.fileList) {
    return Promise.all(
      fileList.map(__file => {
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
    this.componentFileList = ['package.json', 'README.md'];
    this.fileTemplate = ['./src/index.ejs', './src/components/template.ejs'];
    this.gitAddress = 'jiawang1/template-component';
  }
  generate(targetPath, data) {
    super.generate(targetPath, data);
    const { componentName } = data;

    if (componentName) {
      const oldComponentPackagePath = path.join(targetPath, 'packages', componentTemplate);
      const newComponentPackagePath = path.join(targetPath, 'packages', componentName);
      fs.renameSync(oldComponentPackagePath, newComponentPackagePath);

      const fileTemplate = this.__renameEjsToJs(this.fileTemplate, newComponentPackagePath);
      super.generate(newComponentPackagePath, data, [...this.componentFileList, ...fileTemplate]);
    }
  }

  __renameEjsToJs(fileList, parentPath) {
    return fileList.map(file => {
      const __newFile = `${file.slice(0, file.lastIndexOf('.'))}.js`;
      const oldFile = path.join(parentPath, file);
      const newFile = path.join(parentPath, __newFile);
      fs.renameSync(oldFile, newFile);
      return __newFile;
    });
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
