const Checker = require('../util/AppChecker');
const projectInit = require('../util/project_init.js');
const async = require('async');
const appUtils = require('../util/AppUtils');
const path = require('path');
const c = require('../../config/local.config.json').config;
const repoData = require('../data/repos.js');
const dockerActions = require('./ws_docker_actions.js')

const JoiAppConditions = Checker.JoiAppConditions;
const AppConditions = Checker.AppConditions;
const log = appUtils.getLogger();


function installation(config, callback, notifyCallback) {
  if (!config) callback(new Error('config no defined!'));
  async.waterfall([
    // Checking
    (cb) => Checker.checkParams(config, ['mainDir', 'name'], cb),
    (cb) => AppConditions.check(config.mainDir, 'filetype', cb),
    (cb) => AppConditions.check(config.name, 'filetype', cb),
    (cb) => {
      if (config.githubURL) {
        JoiAppConditions.check(config.githubURL, 'url', (err) => {
          cb(err);
        });
      } else cb(null);
    },
    // Create configuration file
    (cb) => {
      log.info('Create configuration file');
      projectInit.createConfig(path.basename(appUtils.path_userconfig()), config, cb);
    },
    // Create DSP directories
    (cb) => {
      log.info('Create dsp directories ');
      projectInit.createDSP(path.basename(appUtils.path_userconfig()), cb, notifyCallback);
    },
    // Download a single docker image
    (cb) => {
      log.info('Download single docker image');
      dockerActions.downloadImages({name: 'dockersecplayground/alpine', tag: 'latest'}, null, cb, notifyCallback)
    },
    (data, cb) => {
        const repos = c.repos;
        repoData.create(repos, cb);
    },
    (cb) => projectInit.initRepos(cb, notifyCallback)
    // Clone main repository
  ],
  (err, response) => {
    log.info('END');
    callback(err, response);
  });
}


exports.installation = installation;
