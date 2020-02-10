'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  redis: {
    enable: true,
    package: 'egg-redis',
  },
  pomelo: {
    enable: true,
    package: 'egg-pomelo',
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
};
