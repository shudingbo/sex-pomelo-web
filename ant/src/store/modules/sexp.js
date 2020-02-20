
import { axios } from '@/utils/request';
import Vue from 'vue';
import { globalCfg } from '@/config/globalCfg';
import notification from 'ant-design-vue/es/notification';

function makeNode (sInfo) {
  return {
    time: '2010-4-5 05:59:15 AM',
    serverId: sInfo.serverId,
    serverType: sInfo.serverType,
    pid: -1,
    cpuAvg: 0,
    memAvg: 0,
    vsz: 0,
    rss: 0,
    usr: 0,
    sys: 0,
    gue: 0,
    host: sInfo.host,
    port: sInfo.port,
    clientPort: sInfo.clientPort,
    frontend: sInfo.frontend,
    uptime: 0,
    heapUsed: 0,
    runStatus: (sInfo.runStatus === undefined) ? false : sInfo.runStatus
  };
}

function makeSys (host) {
  return {
    Time: '2010-4-5 05:59:15 AM',
    hostname: host,
    host,
    cpu_user: -1,
    cpu_nice: -1,
    cpu_system: -1,
    cpu_iowait: -1,
    cpu_steal: -1,
    cpu_idle: -1,
    tps: -1,
    kb_read: -1,
    kb_wrtn: -1,
    kb_read_per: -1,
    kb_wrtn_per: -1,
    totalmem: -1,
    freemem: -1,
    'free/total': 0,
    m_1: 0,
    m_5: 0,
    m_15: 0,
    ip: host,
    nodes: {}
  };
}

async function getServers () {
  let resp = await axios({
    url: '/getAllServers',
    method: 'get',
    params: { }
  });
  return resp;
};

async function runPomeloCliCmd (cmd) {
  let resp = await axios({
    url: '/pomelo',
    method: 'get',
    params: { cmd }
  });
  return resp;
};

async function startServer (serInfo) {
  let cmd = `add host=${serInfo.host} serverType=${serInfo.serverType} id=${serInfo.serverId}`;
  if (serInfo.port > 0) {
    cmd += ` port=${serInfo.port}`;
  }

  if (serInfo.clientPort > 0) {
    cmd += ` clientPort=${serInfo.clientPort}`;
  }

  if (serInfo.frontend === true) {
    cmd += ` frontend=true`;
  }

  const resp = await runPomeloCliCmd(cmd);
  return resp;
}

async function timeout (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve(); }, ms);
  });
}

/**
 *
 * @param {object} state 状态
 * @param {array} serverIds 服务ID数组
 * @param {boolean} frontendAfter true,前端服务器是否放在后面
 */
function makeBatchOperaList (state, serverIds, frontendAfter) {
  let data = [];
  let dataFront = [];
  let dataFrontBack = [];
  let sers = state.servers;
  for (let id of serverIds) {
    let ser = sers[id];
    if (ser === undefined) {
      continue;
    }

    let bInfo = { serverId: ser.serverId,
      runStatus: ser.runStatus,
      actionSta: 0 // 0,等待处理;1,处理完成;2,处理失败,3,忽略
    };
    if (ser.frontend === 'true' || ser.frontend === true) {
      if (ser.port !== undefined && ser.port > 0) {
        dataFrontBack.push(bInfo);
      } else {
        dataFront.push(bInfo);
      }
    } else {
      data.push(bInfo);
    }
  }

  if (frontendAfter) {
    data.push(...dataFrontBack);
    data.push(...dataFront);
  } else {
    data.unshift(...dataFrontBack);
    data.unshift(...dataFront);
  }

  return data;
}

const sexp = {
  state: {
    systemInfo: {},
    nodeInfo: {},
    servers: {},
    systemInfoMap: {},
    nodeHostMap: {}, // node 和 system 映射(存储节点在那个机子上) serverId:host
    ipHostMap: {}, // ip 和 host 映射表( 对应的ip在那个节点上) ip:host
    batchActionInfo: {
      action: '', // 动作
      isRun: false, // 是否正在运行
      servers: [] // 正在处理的服务器列表
    }
  },
  mutations: {
    SET_SYSTEMINFO: (state, systemInfo) => {
      state.systemInfo = systemInfo;
      let system = state.systemInfoMap;
      for (let serId in systemInfo) {
        let sInfo = systemInfo[serId];
        if (system[sInfo.host] === undefined) {
          let ob = Object.assign({}, sInfo);
          ob.ip = '127.0.0.1';
          delete ob.serverId;
          ob.nodes = {};
          ob.nodes[ serId ] = {};
          system[sInfo.host] = ob;
        } else {
          let nodes = system[sInfo.host].nodes;
          if (nodes[sInfo.serverId] === undefined) {
            nodes[ sInfo.serverId ] = {};
          }
        }

        state.nodeHostMap[sInfo.serverId] = sInfo.host;
      }
    },
    SET_NODEINFO: (state, nodeInfo) => {
      state.nodeInfo = nodeInfo;
      let system = state.systemInfoMap;
      let nodeHostMap = state.nodeHostMap;
      for (let serId in nodeInfo) {
        let sInfo = nodeInfo[serId];
        let ob = Object.assign({}, sInfo);
        let sysName = nodeHostMap[serId];
        if ((sysName !== undefined) && (system[ sysName ] !== undefined)) {
          let sysIt = system[ sysName ];
          if (sysIt !== undefined) {
            sysIt.nodes[ serId ] = ob;
          }
        }
      }
    },
    SET_SERVERS: (state, servers) => {
      state.servers = servers;
      let system = state.systemInfoMap;
      let nodeHostMap = state.nodeHostMap;
      let ipHostMap = state.ipHostMap;

      for (let serId in servers) {
        let sInfo = servers[serId];
        let sysName = nodeHostMap[serId];
        if (sysName === undefined) {
          sysName = ipHostMap[sInfo.host];
          if (sysName === undefined) {
            let ob = makeSys(sInfo.host);
            system[ob.host] = ob;
            ipHostMap[sInfo.host] = ob.host;
            nodeHostMap[sInfo.serverId] = ob.host;
            sysName = ob.host;
          } else {
            nodeHostMap[serId] = sysName;
          }
        }
        let sysIt = system[ sysName ];
        if ((sysIt !== undefined) && (sysIt.nodes[ serId ] !== undefined)) {
          let ser = sysIt.nodes[ serId ];
          ipHostMap[ sInfo.host ] = sysName;
          sysIt.ip = sInfo.host;

          for (let prop in sInfo) {
            if (ser[prop] === undefined || ser[prop] !== sInfo[prop]) {
              ser[prop] = sInfo[prop];
            }
          }
          if (ser.runStatus === undefined) {
            ser.runStatus = false;
          }
        } else {
          let newNode = makeNode(sInfo);
          state.nodeInfo[sInfo.serverId] = newNode;
          state.systemInfoMap[sysName].nodes[sInfo.serverId] = newNode;
        }
      }

      // filter overTime server
      for (let sys in state.systemInfoMap) {
        let nodes = state.systemInfoMap[sys].nodes;
        for (let ser in nodes) {
          if (servers[ser] === undefined) {
            delete nodes[ser];
          }
        }
      }
    },
    UPDATE_SERVERS: (state) => {
      state.systemInfoMap = { ...state.systemInfoMap };
    },
    ADD_SERVERS: (state, servers) => {
      let system = state.systemInfoMap;
      let nodeHostMap = state.nodeHostMap;
      let ipHostMap = state.ipHostMap;

      for (let server of servers) {
        let serId = server.serverId;
        let sInfo = server;
        let sysName = ipHostMap[sInfo.host];

        let newNode = makeNode(sInfo);

        if (sysName === undefined) {
          let ob = makeSys(sInfo.host);

          ob.nodes[ serId ] = newNode;
          Vue.set(system, ob.host, ob);

          Vue.set(ipHostMap, sInfo.host, ob.host);
          Vue.set(nodeHostMap, sInfo.serverId, ob.host);
          sysName = ob.host;
          Vue.set(state.systemInfo, ob.host, ob);
          Vue.set(state.nodeInfo, sInfo.serverId, newNode);
          Vue.set(state.servers, sInfo.serverId, newNode);
        } else {
          Vue.set(state.systemInfoMap[ sysName ].nodes, sInfo.serverId, newNode);

          Vue.set(state.nodeInfo, sInfo.serverId, newNode);
          Vue.set(state.servers, sInfo.serverId, newNode);
          Vue.set(nodeHostMap, sInfo.serverId, sysName);
        }
      }

      state.systemInfoMap = { ...state.systemInfoMap };
    },
    UPDATE_SERVER: (state, serverInfo) => {
      let serverId = serverInfo.serverId;

      let sysName = state.nodeHostMap[serverId];
      if (sysName === undefined) {
        console.warn('Not find');
        return;
      }

      let curSysMap = state.systemInfoMap[sysName];
      let curSerInfo = curSysMap.nodes[serverId];
      let needMove = false; // node是否移动到其它sys
      if ((serverInfo.host !== undefined) && (curSerInfo.host !== serverInfo.host)) {
        needMove = true;
      }

      let sServers = state.servers[serverId];
      let sNodeInfo = state.nodeInfo[serverId];
      let sSysMap = curSysMap;
      if (needMove === true) {
        let sysName = state.ipHostMap[serverInfo.host];
        if (sysName !== undefined) {
          sSysMap = state.systemInfoMap[sysName];
        } else {
          let ob = makeSys(serverInfo.host);
          state.systemInfoMap[ob.host] = ob;
          state.ipHostMap[serverInfo.host] = ob.host;
          state.nodeHostMap[serverId] = ob.host;
          sysName = ob.host;
          sSysMap = ob;
        }
      }

      // 更新新的信息
      for (let key in serverInfo) {
        if (sNodeInfo[key] !== undefined) {
          sNodeInfo[key] = serverInfo[key];
        }
        if (sServers[key] !== undefined) {
          sServers[key] = serverInfo[key];
        }
        if (curSerInfo[key] !== undefined) {
          curSerInfo[key] = serverInfo[key];
        }
      }
      sSysMap.nodes[serverId] = curSerInfo;

      // 移除老的信息
      if (needMove === true) {
        delete curSysMap.nodes[serverId];
      }
      //
      state.systemInfoMap = { ...state.systemInfoMap };
    },
    DELETE_SERVERS: (state, serverId) => {
      let sysName = state.nodeHostMap[serverId];
      if (sysName === undefined) {
        console.warn('Not find');
        return;
      }
      let curSysMap = state.systemInfoMap[sysName];
      delete curSysMap.nodes[serverId];
      delete state.servers[serverId];
      delete state.nodeInfo[serverId];

      state.systemInfoMap = { ...state.systemInfoMap };
    },

    RUN_BATCH: (state, data) => {
      let bInfo = state.batchActionInfo;
      bInfo.action = data.action;
      bInfo.servers = data.servers;
      bInfo.isRun = true;
    },
    STOP_BATCH: (state) => {
      state.batchActionInfo.isRun = false;
    }
  },
  actions: {
    async GetSystemInfo ({ commit }, data) {
      const resp = await runPomeloCliCmd('systemInfo');
      if (resp.status === 'success') {
        commit('SET_SYSTEMINFO', resp.data);
      }
    },
    async GetNodeInfo ({ commit }, data) {
      const resp = await runPomeloCliCmd('nodeInfo');
      if (resp.status === 'success') {
        commit('SET_NODEINFO', resp.data);
      }
    },
    async GetServers ({ commit }, data) {
      const resp = await getServers();
      if (resp.status === 'success') {
        commit('SET_SERVERS', resp.data);
      }
    },
    async AddServer ({ commit }, servers) {
      if (servers instanceof Array) {
        commit('ADD_SERVERS', servers);
      } else {
        commit('ADD_SERVERS', [servers]);
      }
    },
    async StopServer ({ commit }, serverId, forceUpdate = true) {
      const resp = await runPomeloCliCmd(`stop ${serverId}`);
      if (resp.status === 'success' && forceUpdate === true) {
        commit('UPDATE_SERVER', { serverId, runStatus: false });
      }
      return resp;
    },
    async StartServer ({ commit }, serInfo, forceUpdate = true) {
      const resp = await startServer(serInfo);
      if (resp.status === 'success' && forceUpdate === true) {
        commit('UPDATE_SERVER', { serverId: serInfo.serverId, runStatus: true });
      }
      return resp;
    },

    async BatchStartServer ({ commit, state }, serverIds) {
      let ls = makeBatchOperaList(state, serverIds, globalCfg.group.startFrontendAfter);

      commit('RUN_BATCH', { action: 'start', servers: ls });
      let notiKey = 'batchRunKey';
      for (let it of ls) {
        if (it.runStatus === false) {
          let sInfo = state.servers[ it.serverId ];
          if (sInfo !== undefined) {
            let ret = await startServer(sInfo);
            if (ret.status === 'success') {
              it.runStatus = true;
              it.actionSta = 1;
              notification.info({ key: notiKey, message: `${sInfo.serverId} start ok.` });
            } else {
              it.actionSta = 2;
              notification.error({ key: notiKey,
                message: `${sInfo.serverId} start error.`,
                description: ret.message
              });
            }

            await timeout(3000);
          }
        } else {
          it.actionSta = 1;
        }
      }

      commit('STOP_BATCH');

      const resp = await getServers();
      if (resp.status === 'success') {
        commit('SET_SERVERS', resp.data, true);
        commit('UPDATE_SERVERS');
      }
    },

    async BatchStopServer ({ commit, state }, serverIds) {
      let ls = makeBatchOperaList(state, serverIds, globalCfg.group.stopFrontendAfter);

      commit('RUN_BATCH', { action: 'stop', servers: ls });
      let notiKey = 'batchRunKey';
      for (let it of ls) {
        if (it.runStatus === true) {
          let sInfo = state.servers[ it.serverId ];
          if (sInfo !== undefined) {
            let ret = await runPomeloCliCmd(`stop ${sInfo.serverId}`);
            if (ret.status === 'success') {
              it.runStatus = false;
              it.actionSta = 1;
              notification.info({ key: notiKey, message: `${sInfo.serverId} stop ok.` });
            } else {
              it.actionSta = 2;
              notification.error({ key: notiKey,
                message: `${sInfo.serverId} stop error.`,
                description: ret.message
              });
            }

            await timeout(3000);
          }
        } else {
          it.actionSta = 1;
        }
      }

      commit('STOP_BATCH');

      const resp = await getServers();
      if (resp.status === 'success') {
        commit('SET_SERVERS', resp.data, true);
        commit('UPDATE_SERVERS');
      }
    },

    async UpdateServer ({ commit }, serverInfo) {
      const resp = await axios({
        url: '/upServerInfo',
        method: 'post',
        data: serverInfo
      });
      if (resp.status === 'success') {
        commit('UPDATE_SERVER', serverInfo);
      }
      return resp;
    },
    async DeleteServer ({ commit }, serverId) {
      const resp = await axios({
        url: '/unregServer',
        method: 'delete',
        data: { serverId }
      });

      if (resp.status === 'success') {
        commit('DELETE_SERVERS', serverId);
      }

      return resp;
    }
  },
  getters: {
    sexpSystemInfo: state => state.systemInfo,
    sexpNodeInfo: state => state.nodeInfo,
    sexpServers: state => state.servers,
    sexpSystemMap: state => state.systemInfoMap,
    sexpSystem: state => (id) => {
      return state.systemInfoMap[ state.ipHostMap[ id ] ];
    },
    sexpNode: state => (id) => {
      return state.systemInfoMap[ state.nodeHostMap[ id ] ].nodes[id];
    },
    sexpBatchInfo: state => state.batchActionInfo
  }
};

export default sexp;
