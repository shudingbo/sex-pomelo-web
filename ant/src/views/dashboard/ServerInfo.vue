<template>
  <div>
    <a-row>
      <a-col :span="6">
        <a-card title="Server Info">
          <table style="margin:3px;">
            <tr><td class="colName">serverId</td><td class="colVal"><a-tag>{{serInfo.serverId}}</a-tag></td></tr>
            <tr><td class="colName">serverType</td><td class="colVal"><a-tag>{{serInfo.serverType}}</a-tag></td></tr>
            <tr><td class="colName">host</td><td class="colVal"><a-tag>{{serInfo.host}}</a-tag></td></tr>
            <tr><td class="colName">port</td><td class="colVal"><a-tag>{{serInfo.port}}</a-tag></td></tr>
            <tr><td class="colName">clientPort</td><td class="colVal"><a-tag>{{serInfo.clientPort}}</a-tag></td></tr>
            <tr><td class="colName">frontend</td><td class="colVal"><a-tag>{{serInfo.frontend}}</a-tag></td></tr>
            <tr><td colspan="2" class="colTitle">Runtime Status</td></tr>
            <tr><td class="colName">runStatus</td><td class="colVal"><a-tag :color="serInfo.runStatus==='true'?'green':''">{{serInfo.runStatus}}</a-tag></td></tr>
            <tr><td class="colName">pid</td><td class="colVal"><a-tag>{{serInfo.pid}}</a-tag></td></tr>
            <tr><td class="colName">heapUsed(M)</td><td class="colVal"><a-tag>{{ serInfo.heapUsed}}</a-tag></td></tr>
            <tr><td class="colName">uptime(m)</td><td class="colVal"><a-tag>{{ serInfo.uptime}}</a-tag></td></tr>
          </table>
        </a-card>
      </a-col>
      <a-col :span="18">
        <a-card title="Server CMD">
        </a-card>
      </a-col>
    </a-row>

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
      serInfo: {},
      loginInfo: {}
    };
  },
  created () {
    this.serInfo = this.$route.query;
    this.setSexpContext(this.serInfo.serverId);
  },
  mounted () {
    console.log(this.serInfo);
    if (this.serInfo.frontend === true) {
      this.getLoginInfo();
    }
  },
  methods: {
    async getLoginInfo () {
      const ret = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `show logins`, context: this.serInfo.serverId }
      });

      console.log(ret);
      if (ret.status === 'success') {

      }

      this.axiosMsg(ret);
    }
  }
};
</script>
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
