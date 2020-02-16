'use strict';

const Service = require('egg').Service;

const key_ServerList = 'sexp:serls';


class PomeloService extends Service {

  /** 从redis获取服务器列表 */
  async GetRegServers() {
    const ret = await this.app.redis.hgetall(key_ServerList);
    for (const id in ret) {
      ret[id] = JSON.parse(ret[id]);
    }
    return ret;
  }
  async GetRegServersName() {
    const ret = await this.app.redis.hkeys(key_ServerList);
    return ret;
  }


  /** 获取指定 serverId的注册配置
   *
   * @param {string} serverId serverID
   *
   * @return {object|null} null,表示不存在
   */
  async getRegServer(serverId) {
    const ret = await this.app.redis.hget(key_ServerList, serverId);
    if (ret !== null) {
      return JSON.parse(ret);
    }

    return null;
  }

  /** 添加服务器到redis
   *
   * @param {object} servers regServers
   */
  async regServers(servers) {
    if (Object.keys(servers).length === 0) {
      return true;
    }

    const ret = await this.app.redis.hmset(key_ServerList, servers);
    return ret;
  }

  /** 从redis删除服务器
   *
   * @param {string} serverId 服务器ID
   */
  async unregServers(serverId) {
    const ret = await this.app.redis.hdel(key_ServerList, serverId);
    return ret;
  }


  async getOlLineData(sTime, eTime) {


    return [];
  }
}

module.exports = PomeloService;
