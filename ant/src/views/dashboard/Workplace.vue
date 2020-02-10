<template>
  <div>
    <a-card title="服务器列表">
      <div slot="extra">
            <a-input-search
                placeholder="筛选"
                v-model="filter[0]"
                style="width:120px;margin-right:5px">
            </a-input-search>
          </div>
      <a-table :columns="ServerCloumn" :dataSource="servers" :pagination="false" size="small" rowKey="serverId" bordered="">
        <template slot="slTag" slot-scope="text,record">
          <a-tag :color="record.enabled?'green':''"> {{ text}} </a-tag>
        </template>
        <template slot="slOper" slot-scope="text,record" v-if="record.serverType!='master'">
          <a-popconfirm v-if="record.runStatus" :title="`Sure to Stop ${record.serverId}`" @confirm="() => stopServer(record)">
            <a-button size="small" type="danger" icon="poweroff"></a-button>
          </a-popconfirm>
          <a-popconfirm v-if="!record.runStatus" :title="`Sure to Start ${record.serverId}`" @confirm="() => startServer(record)">
            <a-button size="small" type="primary" icon="reload"></a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script>
import { axios } from '@/utils/request';

export default {
  name: 'Workplace',
  components: {

  },
  data () {
    return {
      servers: [],
      filter: ['']
    };
  },
  computed: {
    ServerCloumn () {
      const ServerCloumn = [
        {
          title: 'serverId',
          dataIndex: 'serverId',
          filteredValue: this.filter || null,
          onFilter: (value, record) => {
            return this.filterFnNor(value, record);
          },
          sorter: (a, b) => a.serverId - b.serverId
        },
        { title: 'serverType', dataIndex: 'serverType', width: 140, sorter: (a, b) => a.serverType.localeCompare(b.serverType) },
        { title: 'host', dataIndex: 'host', width: 120, scopedSlots: { customRender: 'slTag' }, sorter: (a, b) => a.host.localeCompare(b.host) },
        { title: 'pid', dataIndex: 'pid', width: 50, sorter: (a, b) => a.pid - b.pid },
        { title: 'heapUsed(M)', dataIndex: 'heapUsed', sorter: (a, b) => a.heapUsed - b.heapUsed },
        { title: 'upTime(m)', dataIndex: 'uptime', sorter: (a, b) => a.upTime - b.upTime },
        { title: '操作', scopedSlots: { customRender: 'slOper' } }
      ];
      return ServerCloumn;
    }
  },
  created () {
    this.getServiceList();
  },
  mounted () {
  },
  methods: {
    async getServiceList () {
      const ret = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: 'show servers' }
      });
      if (ret.status === 'success') {
        for (let key in ret.data.info) {
          let info = ret.data.info[key];
          info.runStatus = true;
          this.servers.push(info);
        }
        console.log(this.servers);
      } else {
        this.$message.warn(ret.message);
      }
    },
    async stopServer (serverInfo) {
      let serverId = serverInfo.serverId;
      const ret = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `stop ${serverId}` }
      });
      if (ret.status === 'success') {
        serverInfo.runStatus = false;
      }

      this.axiosMsg(ret);
    },
    async startServer (serverInfo) {

    },
    filterFnNor (key, it) {
      let szServerID = it.serverId.toString();
      if (szServerID.indexOf(key) !== -1) {
        return true;
      }

      if (it.serverType.indexOf(key) !== -1) {
        return true;
      }

      return false;
    }
  }
};
</script>

<style lang="less" scoped>

</style>
