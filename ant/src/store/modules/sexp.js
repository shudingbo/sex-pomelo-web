
import { axios } from '@/utils/request';
import Vue from 'vue';

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
    runStatus: false
  };
}

function makeSys (host) {
  return {
    Time: '2010-4-5 05:59:15 AM',
    hostname: host,
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

const sexp = {
  state: {
    systemInfo: {},
    nodeInfo: {},
    servers: {},
    systemInfoMap: {},
    nodeHostMap: {}, // node 和 system 映射(存储节点在那个机子上) serverId:host
    ipHostMap: {} // ip 和 host 映射表( 对应的ip在那个节点上) ip:host
  },
  mutations: {
    SET_SYSTEMINFO: (state, systemInfo) => {
      state.systemInfo = systemInfo;
      let system = state.systemInfoMap;
      for (let serId in systemInfo) {
        let sInfo = systemInfo[serId];
        if (system[sInfo.hostname] === undefined) {
          let ob = Object.assign({}, sInfo);
          ob.ip = '127.0.0.1';
          delete ob.serverId;
          ob.nodes = {};
          ob.nodes[ serId ] = {};
          system[sInfo.hostname] = ob;
        } else {
          let nodes = system[sInfo.hostname].nodes;
          if (nodes[sInfo.serverId] === undefined) {
            nodes[ sInfo.serverId ] = {};
          }
        }

        state.nodeHostMap[sInfo.serverId] = sInfo.hostname;
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
            system[ob.hostname] = ob;
            ipHostMap[sInfo.host] = ob.hostname;
            nodeHostMap[sInfo.serverId] = ob.hostname;
            sysName = ob.hostname;
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
            if (ser[prop] === undefined) {
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
          // system[ob.hostname] = ob;
          Vue.set(system, ob.hostname, ob);

          Vue.set(ipHostMap, sInfo.host, ob.hostname);
          Vue.set(nodeHostMap, sInfo.serverId, ob.hostname);
          sysName = ob.hostname;
          // state.systemInfo[ob.hostname] = ob;
          Vue.set(state.systemInfo, ob.hostname, ob);
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
    }
  },
  actions: {
    async GetSystemInfo ({ commit }, data) {
      const resp = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `systemInfo` }
      });

      if (resp.status === 'success') {
        commit('SET_SYSTEMINFO', resp.data);
      }
    },
    async GetNodeInfo ({ commit }, data) {
      const resp = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `nodeInfo` }
      });

      if (resp.status === 'success') {
        commit('SET_NODEINFO', resp.data);
      }
    },
    async GetServers ({ commit }, data) {
      const resp = await axios({
        url: '/getAllServers',
        method: 'get',
        params: { }
      });

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
    }
  }
};

export default sexp;
