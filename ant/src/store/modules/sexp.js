
import { axios } from '@/utils/request';

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
        let ob = Object.assign({}, sInfo);
        let sysName = nodeHostMap[serId];
        if ((sysName !== undefined) && (system[ sysName ] !== undefined)) {
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
          }
        }
      }
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
        url: '/pomelo',
        method: 'get',
        params: { cmd: `show servers` }
      });

      if (resp.status === 'success') {
        commit('SET_SERVERS', resp.data);
      }
    }
  },
  getters: {
    sexpSystemInfo: state => state.systemInfo,
    sexpNodeInfo: state => state.nodeInfo,
    sexpServers: state => state.servers,
    sexpSystemMap: state => state.systemInfoMap
  }
};

export default sexp;
