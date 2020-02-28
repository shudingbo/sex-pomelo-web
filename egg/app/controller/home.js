'use strict';

const Controller = require('egg').Controller;

const checkField = [[ 'serverId', 'string' ],
  [ 'serverType', 'string' ],
  [ 'host', 'string' ],
  [ 'port', 'number' ],
  [ 'clientPort', 'number' ],
  [ 'frontend', 'boolean' ],
];

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.success = { message: '404' };
  }

  async getMasters() {
    const { ctx } = this;
    const ret = await this.app.pomelo.runMgrCmd('getMasters');

    if (ret.status === false) {
      ctx.error = { message: ret.message };
    } else {
      ctx.success = { data: ret };
    }
  }

  async pomelo() {
    const { ctx } = this;
    const cmd = ctx.query.cmd;
    let context = ctx.query.context;

    const masterName = ctx.locals.pomelo.masterName;
    if (typeof (masterName) !== 'string') {
      ctx.error = { message: 'masterName required!' };
      return;
    }

    if (typeof (context) !== 'string') {
      context = 'all';
    }

    if (typeof (cmd) === 'string' && cmd.length <= 1) {
      ctx.error = { message: 'error cmd' };
      return;
    }

    const ret = await this.app.pomelo.runAction(cmd, context, masterName);
    if (ret.status === true) {
      if (cmd.indexOf('monitorLog') === -1) {
        ctx.success = ret.data;
      } else {
        ctx.success = ret.data.body.data;
      }

    } else {
      ctx.error = { message: ret.message };
    }
  }

  async getAllServers() {
    const { ctx } = this;
    const masterName = ctx.locals.pomelo.masterName;
    const ret = await this.app.pomelo.runAction('show servers', 'all', masterName);

    let runServers = {};
    if (ret.status === true) {
      runServers = ret.data;
    }

    const regServers = await this.service.pomelo.pomelo.GetRegServers(masterName);

    // 检测未注册的
    const modifyServer = {};
    for (const id in runServers) {
      const { serverId, serverType, host, port, frontend, clientPort } = runServers[id];
      if (regServers[id] === undefined) {
        modifyServer[id] = JSON.stringify({ serverId, serverType, host, port, frontend, clientPort });
      } else {
        const { host: hostr, port: portr, clientPort: clientPortr } = regServers[id];
        if (host !== hostr || port !== portr || clientPort !== clientPortr) {
          modifyServer[id] = JSON.stringify({ serverId, serverType, host, port, frontend, clientPort });
        }
      }

      runServers[id].runStatus = true;
    }

    // 注册有变化的服务器
    await this.service.pomelo.pomelo.regServers(masterName, modifyServer);

    // 把 已经注册的未运行的添加进去
    for (const id in regServers) {
      if (runServers[id] === undefined) {
        regServers[id].runStatus = false;
        runServers[id] = Object.assign({}, regServers[id], { pid: -1,
          heapUsed: '0',
          uptime: '0' });
      }
    }

    ctx.success = runServers;
  }

  async regServer() {
    const { ctx } = this;
    const body = ctx.request.body;
    const masterName = ctx.locals.pomelo.masterName;

    const ret = await this.service.pomelo.pomelo.getRegServer(masterName, body.serverId);
    if (ret !== null) {
      ctx.error = { message: 'ServerId has exist!' };
      return;
    }

    for (const v of checkField) {
      if (body[v[0]] === undefined || typeof (body[v[0]]) !== v[1]) {
        ctx.error = { message: `${v[0]} not exist Or type err` };
        return;
      }
    }

    const data = {};
    data[body.serverId] = JSON.stringify(body);
    await this.service.pomelo.pomelo.regServers(masterName, data);

    ctx.success = { message: `${body.serverId} Add Success!` };
  }

  async regServerBatch() {
    const { ctx } = this;
    const { servers } = ctx.request.body;
    const masterName = ctx.locals.pomelo.masterName;

    const regServers = await this.service.pomelo.pomelo.GetRegServersName(masterName);

    const data = {};
    for (const serId in servers) {
      if (regServers.indexOf(serId) === -1) {
        const info = servers[serId];
        if (info.clientPort === undefined) {
          info.clientPort = 0;
        }
        if (info.frontend === undefined) {
          info.frontend = false;
        }

        let checkRet = true;
        for (const v of checkField) {
          if (info[v[0]] === undefined || typeof (info[v[0]]) !== v[1]) {
            ctx.error = { message: `${v[0]} not exist Or type err` };
            checkRet = false;
            break;
          }
        }

        if (checkRet === true) {
          data[serId] = JSON.stringify(info);
        }
      }
    }

    await this.service.pomelo.pomelo.regServers(masterName, data);
    ctx.success = { message: 'Add Success!', data };
  }

  async unregServer() {
    const { ctx } = this;
    const body = ctx.request.body;
    const masterName = ctx.locals.pomelo.masterName;

    const ret = await this.service.pomelo.pomelo.getRegServer(masterName, body.serverId);
    if (ret !== null) {
      await this.service.pomelo.pomelo.unregServers(masterName, body.serverId);
    }

    ctx.success = { message: `${body.serverId} Unreg Success!` };
  }

  async upServerInfo() {
    const { ctx } = this;
    const body = ctx.request.body;

    const masterName = ctx.locals.pomelo.masterName;
    const ret = await this.service.pomelo.pomelo.getRegServer(masterName, body.serverId);
    if (ret === null) {
      ctx.error = { message: `Can't find Server ${body.serverId}` };
      return;
    }

    for (const it in body) {
      ret[it] = body[it];
    }

    const data = {};
    data[ body.serverId ] = JSON.stringify(ret);

    await this.service.pomelo.pomelo.regServers(masterName, data);
    ctx.success = { message: `${body.serverId} Update Success!` };

  }

  async getAllStartGroup() {
    const { ctx } = this;
    const g = await this.service.pomelo.pomelo.getAllGroup(ctx.locals.pomelo.masterName);
    ctx.success = { group: g };

  }

  async saveStartGroup() {
    const { ctx } = this;
    const body = ctx.request.body;
    const gName = body.name;
    const gData = body.data;

    await this.service.pomelo.pomelo.saveGroup(ctx.locals.pomelo.masterName, gName, gData);
    ctx.success = { message: `Start Group [ ${gName} ] Save OK.` };
  }

  async deleteStartGroup() {
    const { ctx } = this;
    const body = ctx.request.body;
    await this.service.pomelo.pomelo.deleteGroup(ctx.locals.pomelo.masterName, body.name);
    ctx.success = { message: `${body.name} delete Success!` };
  }

  async getServerDetailInfo() {
    const { ctx } = this;
    const serverId = ctx.query.serverId;
    if (typeof (serverId) !== 'string') {
      ctx.error = { message: `serverId: [${serverId}] Error.` };
      return;
    }

    const masterName = ctx.locals.pomelo.masterName;
    const ret = {};
    const rHandler = await this.app.pomelo.runAction('show handler', serverId, masterName);
    if (rHandler.status === false) {
      ctx.error = { message: rHandler.message };
      return;
    }

    const serverType = this.service.pomelo.pomelo.getServerType(serverId);
    ret.handler = rHandler.data[serverType];

    const rModules = await this.app.pomelo.runAction('show modules', serverId, masterName);
    ret.modules = rModules.data;

    const rComponents = await this.app.pomelo.runAction('show components', serverId, masterName);
    ret.components = rComponents.data;

    const rProxy = await this.app.pomelo.runAction('show proxy', serverId, masterName);
    ret.proxy = rProxy.data[serverType];

    const rSetting = await this.service.pomelo.pomelo.getServerSetting(masterName, serverId);
    ret.settings = rSetting;

    ctx.success = ret;
  }

  async getServerConnection() {
    const { ctx } = this;
    const serverId = ctx.query.serverId;
    if (typeof (serverId) !== 'string') {
      ctx.error = { message: `serverId: [${serverId}] Error.` };
      return;
    }

    const masterName = ctx.locals.pomelo.masterName;

    ctx.success = { message: 'Not implement! TODO' };
  }


  async getServerSetting() {
    const { ctx } = this;
    const serverId = ctx.query.serverId;
    if (typeof (serverId) !== 'string') {
      ctx.error = { message: `serverId: [${serverId}] Error.` };
      return;
    }
    const masterName = ctx.locals.pomelo.masterName;

    ctx.success = { message: 'Not implement! TODO' };
  }

}

module.exports = HomeController;
