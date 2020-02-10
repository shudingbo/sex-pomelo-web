'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');


module.exports = {

  /**
   * 发送成功响应
   * @param {Object} data 传入响应参数
   * @example {code: 0,message: 'success'，data: {}}
   */
  set success(data) {
    const status = 'success';
    let code = 0;
    let message = 'success';
    let _data = {};
    if (data) {
      if (data.hasOwnProperty('code')) {
        // 另一种判断方式 'code' in data, 还可用 data.code !== undefined
        code = data.code;
      }
      if (data.hasOwnProperty('message')) {
        message = data.message;
        delete data.message;
      }
      if (data.hasOwnProperty('data')) {
        _data = data.data;
      } else {
        _data = data;
      }
    }
    if (this.locals.hasOwnProperty('admin')) {
      if (this.locals.admin.hasOwnProperty('newToken')) {
        _data.sys_antDnewToken = this.locals.admin.newToken;
      }
    }
    if (this.locals.hasOwnProperty('offinfo')) {
      // token 续期
      if (this.locals.offinfo.hasOwnProperty('newToken')) _data.token = this.locals.offinfo.newToken;
    }
    this.response.body = {
      code,
      status,
      message,
      data: _data,
    };
  },

  /**
   * 发送响应错误
   * @param {Object} data 传入响应参数
   * @example {code: 5000,message: '未知错误'，data: {}}
   */
  set error(data) {
    const status = 'error';
    let code = 5000;
    let message = '未知错误';
    let _data = {};
    if (data.hasOwnProperty('code')) {
      code = data.code;
    }
    if (data.hasOwnProperty('message')) {
      message = data.message;
      delete data.message;
    }
    if (data.hasOwnProperty('data')) {
      _data = data.data;
    } else {
      _data = data;
    }
    if (this.locals.hasOwnProperty('admin')) {
      if (this.locals.admin.hasOwnProperty('newToken')) {
        _data.newToken = this.locals.admin.newToken;
      }
    }
    this.response.body = {
      code,
      status,
      message,
      data: _data,
    };
  },

  /**
   * 自由返回数据
   * @param {*} data 任意数据
   */
  set freeRet(data) {
    this.response.body = data;
  },

  download(fileFullName) {
    let fileName = Math.floor(Date.now() / 1000) + '.zip';
    if (typeof (fileFullName) === 'string') {
      fileName = path.basename(fileFullName);
    }

    this.attachment(fileName);
    this.set('Content-Type', 'application/octet-stream');
    if (fileFullName instanceof Uint8Array) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileFullName);
      this.response.body = bufferStream;
    } else {
      this.response.body = fs.createReadStream(fileFullName);
    }

  },
};
