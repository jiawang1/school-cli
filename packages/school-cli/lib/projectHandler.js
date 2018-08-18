const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const dgr = require('download-git-repo');
const {
    PROJECT_TYPE,
    COMPONENT_TEMPLATE
} = require('./const');

const RegTemplate = /(.*)template(.*)/;

/**
 * used to construct project.
 * download -> parseTemplate
 */
class ProjectHandler {
    constructor(appDir, results, plugins) {
        this.baseDir = appDir;
        this.results = results;
        this.plugins = plugins;
    }

    download() {
        return new Promise((res, rej) => {
            dgr(this.gitAddress, this.baseDir, err => {
                if (err) {
                    rej(err);
                } else {
                    res();
                }
            });
        });
    }
    parseTemplate() {
        return Promise.all(
            this.fileList.map(file => {
                return new Promise((res, rej) => {
                    ejs.renderFile(file, this.results, function(err, str) {
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

    installPlugins() {
        return execPromise(`npm install ${this.plugins.join(' ')}`);
    }

    getProjectPkg() {
        return JSON.parse(fs.readFileSync(path.join(this.baseDir, 'package.json')));
    }
    finalizeProject(pkg, config) {
        fs.writeFileSync(path.join(this.baseDir, 'package.json'), JSON.stringify(pkg), {
            encoding: 'utf8'
        });
        config.finalizeFile(path.join(this.baseDir, '/config'));
    }
}

class ApplicationHandler extends ProjectHandler {
    constructor(...args) {
        super(...args);
        this.fileList = ['package.json', 'README.md'];
        this.gitAddress = 'jiawang1/template';
    }
    parseTemplate() {
        this.fileList = this.fileList.map(file => {
            return path.join(this.parseTemplate, file);
        });
        super.parseTemplate();
    }
}

class ComponentHandler extends ProjectHandler {
    constructor(...args) {
        super(...args);
        this.fileList = ['package.json', 'README.md'];
        this.gitAddress = 'jiawang1/template-component';
    }
    parseTemplate() {
        const {
            componentName
        } = this.results;

        if (componentName) {
            this.results = {...this.results,
                packageName: componentName.toLowerCase()
            };
            const packagesDir = path.join(this.baseDir, 'packages');
            this.__renameTemplate(packagesDir, this.results);
            const templateList = [];
            this.__collectTemplateFiles(packagesDir, templateList);

            const fileTemplate = this.__renameEjsToJs(templateList);

            this.fileList = this.fileList.map(file => {
                return path.join(this.baseDir, file);
            }).concat(fileTemplate);

            super.parseTemplate();
        }
    }

    __renameEjsToJs(fileList) {
        return fileList.map(file => {
            if (file.search(/\.ejs$/) > 0) {
                const __newFile = `${file.slice(0, file.lastIndexOf('.'))}.js`;
                fs.renameSync(file, __newFile);
                return __newFile;
            }
            return file;
        });
    }

    __collectTemplateFiles(dir, list) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullName = path.join(dir, file);
            if (fs.lstatSync(fullName).isFile()) {
                if (file.search(/\.ejs$/) > 0 || this.fileList.includes(file)) {
                    list.push(fullName);
                }
            } else if (fs.lstatSync(fullName).isDirectory()) {
                this.__collectTemplateFiles(fullName, list);
            }
        });
    }

    __renameTemplate(dir, data) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            let fullName = path.join(dir, file);
            if (fs.lstatSync(fullName).isDirectory()) {
                if (file === COMPONENT_TEMPLATE) {
                    fs.renameSync(fullName, path.join(dir, data.packageName));
                    fullName = path.join(dir, data.packageName);
                }
                this.__renameTemplate(fullName, data);
            } else {
                if (file.indexOf(COMPONENT_TEMPLATE) >= 0) {
                    const newName = file.replace(RegTemplate, `$1${data.componentName}$2`);
                    fs.renameSync(fullName, path.join(dir, newName));
                }
            }
        });
    }
    finalizeProject(...args) {
        super.finalizeProject(...args);
    }
}

const getHandler = (templateType, appDir, results) => {
    if (templateType === PROJECT_TYPE.application) {
        return new ApplicationHandler(appDir, results);
    } else {
        return new ComponentHandler(appDir, results);
    }
};

module.exports = getHandler;