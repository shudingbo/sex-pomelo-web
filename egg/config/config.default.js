/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = { appInfo };

  config.bodyParser = {
    enableTypes: [ 'json', 'form', 'text' ],
    jsonLimit: '10mb',
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1581052318117_4532';
  config.cluster = {
    listen: {
      port: 7010,
    },
  };

  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: null,
      db: 3,
    },
  };

  config.pomelo = {
    client: {
      master: {
        host: '127.0.0.1',
        port: 3005,
        username: 'admin',
        password: 'admin',
      },
      port: 6379,
      host: '127.0.0.1',
      // password: null,
      db: 2,
      keyPre: 'sdb:schedule',
      checkInterval: 5000,
      // redisInstanseName: 'redis',
    },
  };

  config.security = {
    csrf: {
      enable: false,
    },
    // 配置白名单
    domainWhiteList: [ 'http://localhost:8080' ],
  };
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  };


  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
    customLogger: {
      pomeloLogger: {
        consoleLevel: 'DEBUG',
        file: 'egg-pomelo.log',
      },
    },
  };
};
