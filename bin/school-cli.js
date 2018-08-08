#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const getHanlder = require('../lib/installHandler');
const util = require('../lib/utils');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const { STATE_MANAGEMENT } = require('../lib/const');

program.version(require('../package.json').version).usage('<command> [project name]');

program
  .command('create <project name>')
  .description('create react based project')
  .action((name, cmd) => {
    const currentPath = process.cwd();
    const files = fs.readdirSync(currentPath);
    let target = null;

    if (files.includes(name)) {
      util.error(`Error : project ${name} already exist.`);
      return;
    }

    inquirer
      .prompt([
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
      ])
      .then(answers => {
        console.log(answers);
        util.log('');

        if(answers.stateManagement === STATE_MANAGEMENT.apollo){
          util.error('apollo is not support yet');
          process.exit(1);
        }

        if (files.length === 0 && path.basename(currentPath) === name) {
          target = currentPath;
        } else {
          target = path.join(currentPath, name);
          fs.mkdirSync(target);
        }
        const handler = getHanlder(answers.type);

        const spinner = ora('Downloading project').start();
        handler
          .download(target)
          .then(() => {
            spinner.text = 'transforming project template';
            return handler.generate(target, { ...answers, name });
          })
          .then(() => {
            spinner.succeed();
            util.log(`project ${name} generated successfully, you can follow steps below to run project:`);
            util.log(`1. enter folder ${name} and execute npm install`);
            util.log(`2. execute npm start`);
          })
          .catch(err => {
            spinner.fail('generate project failed');
            util.error(err);
            util.deleteFolder(target);
            process.exit(1);
          });
      })
      .catch(err => {
        util.error(err);
        util.deleteFolder(target);
        process.exit(1);
      });
  });

program.parse(process.argv);
