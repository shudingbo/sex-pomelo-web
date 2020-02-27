'use strict';

const Service = require('egg').Service;

const key_ServerList = 'sexp:serls';
const key_StartGroup = 'sexp:sgroup';


class PomeloService extends Service {

  /** 从redis获取服务器列表
   * @param {string} masterName which master
  */
  async GetRegServers(masterName) {
    const ret = await this.app.redis.hgetall(`${key_ServerList}:${masterName}`);
    for (const id in ret) {
      ret[id] = JSON.parse(ret[id]);
    }
    return ret;
  }

  async GetRegServersName(masterName) {
    const ret = await this.app.redis.hkeys(`${key_ServerList}:${masterName}`);
    return ret;
  }


  /** 获取指定 serverId的注册配置
   *
   * @param {string} masterName which master
   * @param {string} serverId serverID
   *
   * @return {object|null} null,表示不存在
   */
  async getRegServer(masterName, serverId) {
    const ret = await this.app.redis.hget(`${key_ServerList}:${masterName}`, serverId);
    if (ret !== null) {
      return JSON.parse(ret);
    }

    return null;
  }

  /** 添加服务器到redis
   * @param {string} masterName which master
   * @param {object} servers regServers
   */
  async regServers(masterName, servers) {
    if (Object.keys(servers).length === 0) {
      return true;
    }

    const ret = await this.app.redis.hmset(`${key_ServerList}:${masterName}`, servers);
    return ret;
  }

  /** 从redis删除服务器
   *
   * @param {string} masterName which master
   * @param {string} serverId 服务器ID
   */
  async unregServers(masterName, serverId) {
    const ret = await this.app.redis.hdel(`${key_ServerList}:${masterName}`, serverId);
    return ret;
  }

  async getAllGroup() {
    const ret = await this.app.redis.hgetall(key_StartGroup);
    for (const id in ret) {
      ret[id] = JSON.parse(ret[id]);
    }
    return ret;
  }

  /** 获取指定名称的启动分组
   *
   * @param {string} groupName 启动组名称
   * @return {array|null} null 表示没有
   */
  async getGroupByName(groupName) {
    const ret = await this.app.redis.hget(key_StartGroup, groupName);
    if (ret !== null) {
      return JSON.parse(ret);
    }

    return null;
  }

  /** 保存分组
   *
   * @param {string} groupName 分组名称
   * @param {array} data 数据
   */
  async saveGroup(groupName, data) {
    return await this.app.redis.hset(key_StartGroup, groupName, JSON.stringify(data));
  }

  /** 删除指定名称分组
   *
   * @param {string} groupName 分组名称
   */
  async deleteGroup(groupName) {
    const ret = await this.app.redis.hdel(key_StartGroup, groupName);
    return ret;
  }


  async getOlLineData(sTime, eTime) {


    return [];
  }

  /** get serverType by serberId
   *
   * @param {string} serverId serverId
   * @return {string} serverType
   */
  getServerType(serverId) {
    let serverType = serverId.split('-')[0];
    if (serverType === serverId) {
      serverType = serverId.split('_')[0];
    }
    return serverType;
  }

  /** get Server‘s setting
   *
   * @param {string} masterName master Name
   * @param {string} serverId serverId
   */
  async getServerSetting(masterName, serverId) {
    const rSetting = await this.app.pomelo.runAction('show settings', serverId, masterName);
    if (rSetting.status === true) {
      delete rSetting.data.servers;
      return rSetting.data;
    }

    return {};
  }

  /** get Server‘s connection info
   *
   * @param {string} serverId serverId
   * @param {string} masterName master Name
   */
  async getServerConnections(serverId, masterName) {
    const ret = await this.app.pomelo.runAction('show connections', serverId, masterName);
    if (ret.status === true) {
      return ret.data;
    }

    return {};
  }

  /** get Server‘s connection simple info
   *
   * @param {string} serverId serverId
   * @param {string} masterName master Name
   */
  async getServerConnectionInfo(serverId, masterName) {
    const ret = await this.app.pomelo.runAction('show connectionInfo', serverId, masterName);
    if (ret.status === true) {
      return ret.data;
    }

    return {};
  }
}

module.exports = PomeloService;
