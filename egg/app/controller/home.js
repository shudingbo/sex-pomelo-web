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

  async pomelo() {
    const { ctx } = this;
    const cmd = ctx.query.cmd;
    let context = ctx.query.context;

    if (typeof (context) !== 'string') {
      context = 'all';
    }

    if (typeof (cmd) === 'string' && cmd.length <= 1) {
      ctx.error = { message: 'error cmd' };
      return;
    }

    const ret = await this.app.pomelo.runAction(cmd, context);
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
    const ret = await this.app.pomelo.runAction('show servers', 'all');

    let runServers = {};
    if (ret.status === true) {
      runServers = ret.data;
    }

    const regServers = await this.service.pomelo.pomelo.GetRegServers();
    // console.log(regServers);

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
    await this.service.pomelo.pomelo.regServers(modifyServer);

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

    const ret = await this.service.pomelo.pomelo.getRegServer(body.serverId);
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
    await this.service.pomelo.pomelo.regServers(data);

    ctx.success = { message: `${body.serverId} Add Success!` };
  }

  async regServerBatch() {
    const { ctx } = this;
    const servers = ctx.request.body;

    const regServers = await this.service.pomelo.pomelo.GetRegServersName();

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

    await this.service.pomelo.pomelo.regServers(data);

    ctx.success = { message: 'Add Success!', data };

  }

}

module.exports = HomeController;
