
# school-cli

client tool used to generate project boilerplate base on React. Current support project for web appliction and React component. Currently support DVA by default.

## installation

```code
  npm install school-cli -g
```

## quick start

you can run command *create* to create a project.
```code
  school-cli create <project-name>
```
then you can follow command line guide to finish the creation process.

## client tool enhancement

this is a plugin based tool. So all functions can be supplied by plugin. Plugins can be installed in runtime by NPM. 

### plugin API

1. renderTemplate: this API will be called firstly. Mainly used to copy/render template files to project if ther is.
2. configurePackage(pkg) : this API used to enhance package.json file. Project will generate a default package.json, and then input this file to configurePackage with JSON format.
3. configureCompileInfo(config): the API used to enhance compilation configuration(support webpack Currently). Project default webpack configuration will be input to this method as webpack-chain object. You can enhance the configure by [webpack-chain](https://github.com/mozilla-neutrino/webpack-chain) API.


## TODO

1. storybook
2. less/sass
3. babel
4. support load plugin
5. support dev/pro webpack configure

