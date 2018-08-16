#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const util = require('util');
const exec = require('child_process').exec;
const execPromise = util.promisify(exec);
const getHanlder = require('../lib/projectHandler');
const utils = require('../lib/utils');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const WebpackConfig = require('../lib/WebpackConfig');
const { STATE_MANAGEMENT } = require('../lib/const');

const interaction = ()=>
   inquirer.prompt([
    { name: 'version', default: '1.0.0' },
    { name: 'description' },
    {
      name: 'type',
      type: 'list',
      choices: [
        {
          name: 'web application project',
          value: 1,
          short: 'web application project'
        },
        { name: 'component project', value: 2, short: 'component project' }
      ]
    },
    {
      name: 'componentName',
      message: 'component name',
      when: function(answer) {
        return answer.type === 2;
      }
    },
    {
      name: 'componentVersion',
      default: '1.0.0',
      message: 'component version',
      when: function(answer) {
        return answer.type === 2;
      }
    },
    {
      name: 'componentDescription',
      message: 'component description',
      when: function(answer) {
        return answer.type === 2;
      }
    },
    {
      name: 'stateManagement',
      message: 'state management',
      type: 'list',
      choices: [{ name: 'dva', value: 1, short: 'dva' }, { name: 'apollo', value: 2, short: 'apollo' }],
      when: function(answer) {
        return answer.type === 1;
      }
    }
  ]);


program.version(require('../package.json').version).usage('<command> [project name]');
program
  .command('create <project name>')
  .description('create react based project')
  .action(async (name, cmd) => {
    const currentPath = process.cwd();
    const files = fs.readdirSync(currentPath);

    if (files.includes(name)) {
      utils.error(`Error : project ${name} already exist.`);
      return;
    }
    const answers = await interaction();
    const results = { ...answers, name };
    console.log(results);
    utils.log('');

    if (results.stateManagement === STATE_MANAGEMENT.apollo) {
      utils.error('apollo is not support yet');
      process.exit(1);
    }
    let target = null;
    if (files.length === 0 && path.basename(currentPath) === name) {
      target = currentPath;
    } else {
      target = path.join(currentPath, name);
      fs.mkdirSync(target);
    }
    const defaultPlugins = ['cli-eslint'];
    const handler = getHanlder(results.type , target, results);

    const spinner = ora('Downloading project').start();
    await handler.download(target);

    spinner.text = 'transforming project template';
    await handler.generate(target, results);
    process.chdir(target);
    spinner.text = 'start to download plugins';
    await execPromise(`npm install ${defaultPlugins.join(' ')}`);

    let pkg = handler.getProjectPkg();
    const webpackConfig = new WebpackConfig();

    defaultPlugins.map(plugin => {
      const PluginClass = utils.load(plugin, process.cwd());
      const oPlugin = new PluginClass(target, results);
      oPlugin.renderTemplate();
      oPlugin.configurePackage(pkg);
      oPlugin.configureCompileInfo(webpackConfig);
    });

    handler.finalizeProject(pkg,webpackConfig);


    spinner.succeed();
    utils.log(`project ${name} generated successfully, you can follow steps below to run project:`);
    utils.log(`1. enter folder ${name} and execute npm install`);
    utils.log(`2. execute npm start`);

  });
  // .catch(err => {
  //   spinner.fail('generate project failed');
  //   utils.error(err);
  //   utils.error(err && err.stack);
  //   utils.deleteFolder(target);
  //   process.exit(1);
  // });

program.parse(process.argv);
