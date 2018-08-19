#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const getHandler = require('../lib/projectHandler');
const utils = require('../lib/utils');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const {
    STATE_MANAGEMENT
} = require('../lib/const');

const interaction = () =>
    inquirer.prompt([{
            name: 'version',
            default: '1.0.0'
        },
        {
            name: 'description'
        },
        {
            name: 'type',
            type: 'list',
            choices: [{
                    name: 'web application project',
                    value: 1,
                    short: 'web application project'
                },
                {
                    name: 'component project',
                    value: 2,
                    short: 'component project'
                }
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
            choices: [{
                name: 'dva',
                value: 1,
                short: 'dva'
            }, {
                name: 'apollo',
                value: 2,
                short: 'apollo'
            }],
            when: function(answer) {
                return answer.type === 1;
            }
        }
    ]);

program.version(require('../package.json').version).usage('<command> [project name]');
program
    .command('create <project name>')
    .description('create react based project')
    .action(async(name, cmd) => {

        utils.checkNodeVersion(process.version, 'school-cli')
        utils.validateProjectName(name);

        const currentPath = process.cwd();
        const files = fs.readdirSync(currentPath);

        if (files.includes(name)) {
            utils.error(`Error : project ${name} already exist.`);
            return;
        }
        const answers = await interaction();
        const results = {...answers,
            name
        };
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
        const projectHandler = getHandler(results.type, target, results);

        const spinner = ora('Downloading project').start();
        await projectHandler.download();

        spinner.text = 'transforming project template';
        await projectHandler.parseTemplate();

        process.chdir(target);
        spinner.text = 'start to download plugins';
        await projectHandler.installPlugins();

        spinner.text = 'enhance project by plugins';
        projectHandler.runPlugins();

        projectHandler.finalizeProject();

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