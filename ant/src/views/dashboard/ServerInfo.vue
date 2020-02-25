<template>
  <div>
    <a-row v-if="serverId" :gutter="16">
      <a-col :span="6">
        <a-card :title="serverId">
          <template slot="extra">
            <a-button icon="double-left" @click="$router.back()" style="margin-right:6px;" type="dashed" size="small" title="Back"></a-button>
            <a-popconfirm v-if="serInfo.runStatus" :title="`Sure to Stop ${this.serverId}`" @confirm="() => stopServer()">
              <a-button :disabled="serInfo.isRun" size="small" type="primary" icon="poweroff" style="margin-right:6px;" title="Stop Current Group"></a-button>
            </a-popconfirm>
            <a-popconfirm v-else :title="`Sure to Start ${this.serverId}`" @confirm="() => startServer()">
              <a-button :disabled="serInfo.isRun" size="small" type="danger" icon="caret-right" title="Start Current Group"></a-button>
            </a-popconfirm>
          </template>
          <table style="margin:0px;">
            <tr><td class="colName">Time</td><td class="colVal"><a-tag>{{serInfo.time}}</a-tag></td></tr>
            <tr><td class="colName">serverType</td><td class="colVal"><a-tag>{{serInfo.serverType}}</a-tag></td></tr>
            <tr><td class="colName">host</td><td class="colVal"><a-tag>{{serInfo.host}}</a-tag></td></tr>
            <tr><td class="colName">port</td><td class="colVal"><a-tag>{{serInfo.port}}</a-tag></td></tr>
            <tr><td class="colName">clientPort</td><td class="colVal"><a-tag>{{serInfo.clientPort}}</a-tag></td></tr>
            <tr><td class="colName">frontend</td><td class="colVal"><a-tag>{{serInfo.frontend}}</a-tag></td></tr>
            <tr><td colspan="2" class="colTitle">Runtime Status</td></tr>
            <tr><td class="colName">runStatus</td><td class="colVal"><a-tag :color="serInfo.runStatus?'green':''">{{serInfo.runStatus}}</a-tag></td></tr>
            <tr><td class="colName">pid</td><td class="colVal"><a-tag>{{serInfo.pid}}</a-tag></td></tr>
            <tr><td class="colName">heapUsed(M)</td><td class="colVal"><a-tag>{{ serInfo.heapUsed}}</a-tag></td></tr>
            <tr><td class="colName">uptime(m)</td><td class="colVal"><a-tag>{{ serInfo.uptime}}</a-tag></td></tr>
          </table>
        </a-card>
      </a-col>
      <a-col :span="18">
        <a-tabs defaultActiveKey="base" type="card" >
          <a-tab-pane tab="Base Info" key="base">
            <a-tabs tabPosition="top" defaultActiveKey="Handler" >
              <a-tab-pane tab="Handler" key="Handler">
                <pre >{{JSON.stringify(detailInfo.handler, null,1)}}</pre>
              </a-tab-pane>
              <a-tab-pane tab="Modules" key="Modules">
                <pre>{{JSON.stringify(detailInfo.modules, null,1)}}</pre>
              </a-tab-pane>
              <a-tab-pane tab="Components" key="Components">
                <pre>{{JSON.stringify(detailInfo.components, null,1)}}</pre>
              </a-tab-pane>
              <a-tab-pane tab="Settings" key="Settings">
                <pre>{{JSON.stringify(detailInfo.settings, null,1)}}</pre>
              </a-tab-pane>
              <a-tab-pane tab="Proxy" key="Proxy">
                <pre>{{JSON.stringify(detailInfo.proxy, null,1)}}</pre>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
          <a-tab-pane v-if="serInfo.frontend" tab="Connections" key="connect" forceRender>
            <pre>{{JSON.stringify(loginInfo, null,1)}}</pre>
          </a-tab-pane>
          <a-tab-pane tab="Script" key="script">Content of Tab Pane 3</a-tab-pane>
        </a-tabs>

      </a-col>
    </a-row>
    <div v-else>
      <h2>No serverInfo</h2>
    </div>
  </div>
</template>
<script>

import { axios } from '@/utils/request';
export default {
  name: 'ServerInfo',
  components: {
  },
  data () {
    return {
      serverId: '',
      loginInfo: {}
    };
  },
  computed: {
    serInfo () {
      return this.$store.getters.sexpNode(this.serverId);
    },
    detailInfo () {
      return this.$store.getters.sexpServerDetail(this.serverId);
    }
  },
  created () {
    this.serverId = this.$route.query.serverId;
    this.setSexpContext(this.serverId);
  },
  mounted () {
    (async () => {
      await this.getDetailInfo();
      await this.getLoginInfo();
    })();
  },
  methods: {
    async getLoginInfo () {
      if (this.serInfo.frontend === false || this.serInfo.runStatus === false) {
        return;
      }

      const ret = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `show connections`, context: this.serInfo.serverId }
      });

      if (ret.status === 'success') {
        this.loginInfo = ret.data[this.serInfo.serverId];
      }

      this.axiosMsg(ret);
    },
    async getDetailInfo () {
      if (this.serInfo.runStatus === false) {
        return;
      }

      this.$store.dispatch('GetServerDetail', this.serInfo.serverId);
    },
    async stopServer () {
      let ret = await this.$store.dispatch('StopServer', this.serInfo.serverId);
      this.axiosMsg(ret);
    },
    async startServer () {
      let ret = await this.$store.dispatch('StartServer', this.serInfo);
      this.axiosMsg(ret);
    }
  }
};
</script>

<style>
.ant-card-body {
  padding: 6px;
}
</style>

<style scoped>
div .ant-card-head-title {
  padding: '0px';
}
.ant-card-grid {
  padding: 5px;
}

li{
  height:30px;
  line-height: 30px;
  border-bottom: 1px solid hsl(210, 9%, 96%);

  padding-left: 3px;
}
li .ant-tag{
  margin-left: 5px
}
table {
  margin: 3px;
}
.colName{
  padding-right: 8px;
  padding-top: 10px;
  text-align: right;
}

.colTitle{
  margin: 5px;
  padding-right: 8px;
  padding-top: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  padding-bottom: 6px;
  border-bottom: #bbb solid thin;
}

.colVal{
  margin: 5px;
  text-align: left;
}
</style>
