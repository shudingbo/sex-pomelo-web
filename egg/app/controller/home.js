'use strict';

const Controller = require('egg').Controller;

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

}

module.exports = HomeController;
