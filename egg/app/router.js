'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/pomelo', controller.home.pomelo);
  router.get('/getAllServers', controller.home.getAllServers);
  router.post('/regServer', controller.home.regServer);
  router.post('/regServerBatch', controller.home.regServerBatch);
  router.delete('/unregServer', controller.home.unregServer);
  router.post('/upServerInfo', controller.home.upServerInfo);
  router.get('/getAllStartGroup', controller.home.getAllStartGroup);
  router.post('/saveStartGroup', controller.home.saveStartGroup);
  router.delete('/deleteStartGroup', controller.home.deleteStartGroup);
};
