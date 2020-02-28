'use strict';

module.exports = options => {
  return async function pomeloCheck(ctx, next) {
    if ((typeof (ctx.query.masterName) !== 'string') &&
      (typeof (ctx.request.body.masterName) !== 'string')) {
      ctx.body = {
        code: 5000,
        status: false,
        message: 'masterName field required!',
      };
      return;
    }

    if (typeof (ctx.query.masterName) === 'string') {
      ctx.locals.pomelo = { masterName: ctx.query.masterName };
      delete ctx.query.masterName;
    } else {
      ctx.locals.pomelo = { masterName: ctx.request.body.masterName };
      delete ctx.request.body.masterName;
    }

    await next();
  };
};
