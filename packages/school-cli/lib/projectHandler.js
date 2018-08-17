const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const dgr = require('download-git-repo');
const { PROJECT_TYPE, COMPONENT_TEMPLATE } = require('./const');

const RegTemplate = /(.*)template(.*)/;

class Handler {
  constructor(appDir, results){
    this.baseDir = appDir;
    this.results = results;
  }

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
  generate( data, fileList = this.fileList) {
    return Promise.all(
      fileList.map(file => {
        return new Promise((res, rej) => {
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
  getProjectPkg(){
    return JSON.parse(fs.readFileSync(path.join(this.baseDir, 'package.json')));
  }
  finalizeProject(pkg, config){
    fs.writeFileSync(path.join(this.baseDir, 'package.json'), JSON.stringify(pkg), { encoding: 'utf8' });
    config.finalizeFile(path.join(this.baseDir, '/config'));
  }
}

class ApplicationHandler extends Handler {
  constructor(...args) {
    super(...args);
    this.fileList = ['package.json', 'README.md'];
    this.gitAddress = 'jiawang1/template';
  }
  generate(targetPath, data){
    this.fileList = this.fileList.map(file=>{
      return path.join(targetPath, file);
    });
    super.generate(data, this.fileList);
  }
  finalizeProject(...args){
    super.finalizeProject(...args);
  }
}

class ComponentHandler extends Handler {
  constructor(...args) {
    super(...args);
    this.fileList = ['package.json', 'README.md'];
    this.gitAddress = 'jiawang1/template-component';
  }
  generate(targetPath, data) {
    const { componentName } = data;

    if (componentName) {
      const componentData =  {...data, packageName: componentName.toLowerCase()};
      const packagesDir = path.join(targetPath, 'packages');
      this.__renameTemplate(packagesDir,componentData );
      const templateList = [];
      this.__collectTemplateFiles(packagesDir, templateList);

      const fileTemplate = this.__renameEjsToJs(templateList);

      this.fileList = this.fileList.map(file=>{
        return path.join(targetPath, file);
      });

      super.generate(componentData, [...this.fileList, ...fileTemplate]);
    }
  }

  __renameEjsToJs(fileList) {
    return fileList.map(file => {
      if(file.search(/\.ejs$/)>0){
        const __newFile = `${file.slice(0, file.lastIndexOf('.'))}.js`;
        fs.renameSync(file, __newFile);
        return __newFile;
      }
      return file;
    });
  }

  __collectTemplateFiles(dir, list){
    const files = fs.readdirSync(dir);
    files.forEach(file=>{
      const fullName = path.join(dir, file);
      if(fs.lstatSync(fullName).isFile()){
        if(file.search(/\.ejs$/)>0 || this.fileList.includes(file)){
          list.push(fullName);
        }
      }else if (fs.lstatSync(fullName).isDirectory()){
        this.__collectTemplateFiles(fullName, list);
      }
    });
  }

  __renameTemplate(dir, data){
    const files = fs.readdirSync(dir);
    files.forEach(file=>{
      let fullName = path.join(dir, file);
      if(fs.lstatSync(fullName).isDirectory()){
        if(file === COMPONENT_TEMPLATE){
          fs.renameSync(fullName, path.join(dir, data.packageName));
          fullName = path.join(dir, data.packageName);
        }
        this.__renameTemplate(fullName, data);
      }else{
        if(file.indexOf(COMPONENT_TEMPLATE)>=0){
          const newName = file.replace(RegTemplate, `$1${data.componentName}$2`);
          fs.renameSync(fullName, path.join(dir, newName));
        }
      }
    });
  }
  finalizeProject(...args){
    super.finalizeProject(...args);
  }
}

const getHandler = (templateType,appDir,results) => {
  if (templateType === PROJECT_TYPE.application) {
    return new ApplicationHandler(appDir,results);;
  } else {
    return new ComponentHandler(appDir,results);;
  }
};

module.exports = getHandler;
