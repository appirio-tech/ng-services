// Allows us to use the CoffeeScript gulpfile
require('./node_modules/appirio-gulp-tasks/node_modules/coffee-script/register');

var envFile     = require('./config.js')();
var envConfig   = envFile[process.env.ENVIRONMENT || 'development'];
var assetPrefix = envConfig.CONSTANTS.ASSET_PREFIX.length ? envConfig.CONSTANTS.ASSET_PREFIX : '/';

var config = {
  __dirname: __dirname
};

config.ngConstants = {
  defaultConstants: envConfig,
  destPath: 'services',
  fileName: 'topcoder.constants.js',
  options: {
    name: 'CONSTANTS'
  }
};

config.linters = {
  srcFiles: [
    './services/**/*.js',
    './*.js'
  ]
};

config.karma = {
  serverIntegrationSpecs: ['tests/server-integration/**/*.spec.js']
};

var loadTasksModule = require(__dirname + '/node_modules/appirio-gulp-tasks/load-tasks.coffee');

loadTasksModule.loadTasks(config);
