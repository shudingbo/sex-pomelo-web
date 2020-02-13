<template>
  <div>
    <a-tabs defaultActiveKey="sysT">
      <a-tab-pane tab="Graphics" key="sysG">

      </a-tab-pane>
      <a-tab-pane tab="Table" key="sysT">
        <a-table :columns="sysColumns" :dataSource="sysMapArr" class="components-table-demo-nested" rowKey="hostname" size="small">
            <a-badge slot="slHost" slot-scope="text,record" :count="record.nodes.length" :numberStyle="{backgroundColor: '#52c41a'}">
              <a-tag href="javascript:;">{{text}}</a-tag>
            </a-badge>
          <a-table
            slot="expandedRowRender"
            slot-scope="record"
            :columns="nodeColums"
            :dataSource="record.nodes"
            :pagination="false"
            rowKey="serverId"
            size="small"
          >
            <template slot="slSerId" slot-scope="text,record">
              <router-link :to="{path:'/dashboard/serverinfo',query:record}" tag="a" target="_blank">
                <a-tag>{{text}}</a-tag>
              </router-link>
            </template>
          </a-table>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
import { axios } from '@/utils/request';

const sysColumns = [
  { title: 'host', dataIndex: 'hostname', scopedSlots: { customRender: 'slHost' } },
  { title: 'IP', dataIndex: 'ip' },
  { title: 'Time', dataIndex: 'Time' },
  {
    title: 'CPU',
    children: [
      { title: 'user', dataIndex: 'cpu_user' },
      { title: 'system', dataIndex: 'cpu_system' },
      { title: 'idle', dataIndex: 'cpu_idle' }
    ]
  },
  {
    title: 'IO',
    children: [
      { title: 'tps', dataIndex: 'tps', sorter: (a, b) => a.tps - b.tps },
      { title: 'kb_read', dataIndex: 'kb_read' },
      { title: 'kb_wrtn', dataIndex: 'kb_wrtn' }
    ]
  },
  {
    title: 'Memory(MB)',
    children: [
      { title: 'total', dataIndex: 'totalmem', sorter: (a, b) => a.totalmem - b.totalmem },
      { title: 'free', dataIndex: 'freemem', sorter: (a, b) => a.freemem - b.freemem },
      { title: 'f/t', dataIndex: 'free/total' }
    ]
  }
];

const nodeColums = [
  { title: 'serverId', dataIndex: 'serverId', scopedSlots: { customRender: 'slSerId' }, sorter: (a, b) => a.serverId.localeCompare(b.serverId) },
  { title: 'port', dataIndex: 'port' },
  { title: 'cpuAvg', dataIndex: 'cpuAvg', sorter: (a, b) => a.cpuAvg - b.cpuAvg },
  { title: 'memAvg', dataIndex: 'memAvg', sorter: (a, b) => a.memAvg - b.memAvg },
  {
    title: 'mem(MB)',
    children: [
      { title: 'vsz', dataIndex: 'vsz', sorter: (a, b) => a.vsz - b.vsz },
      { title: 'rss', dataIndex: 'rss', sorter: (a, b) => a.rss - b.rss },
      { title: 'usr', dataIndex: 'usr', sorter: (a, b) => a.usr - b.usr },
      { title: 'sys', dataIndex: 'sys', sorter: (a, b) => a.sys - b.sys },
      { title: 'heapUsed', dataIndex: 'heapUsed', sorter: (a, b) => a.heapUsed - b.heapUsed }
    ]
  },
  { title: 'uptime(m)', dataIndex: 'uptime', sorter: (a, b) => a.uptime - b.uptime }
];

export default {
  name: 'Workplace',
  components: {

  },
  data () {
    return {
      sysColumns,
      nodeColums,
      servers: [],
      filter: ['']
    };
  },
  computed: {
    sysMap () {
      return this.$store.getters.sexpSystemMap;
    },
    sysMapArr () {
      let ret = [];
      let o = this.$store.getters.sexpSystemMap;
      for (let sys in o) {
        let it = o[sys];
        let nodes = [];
        for (let i in it.nodes) {
          let n = Object.assign({}, it.nodes[i]);
          n.vsz = (n.vsz / (1024 * 1024)).toFixed(2);
          n.rss = (n.rss / (1024 * 1024)).toFixed(2);
          nodes.push(n);
        }

        let nO = Object.assign({}, it);
        nO.totalmem = parseInt(nO.totalmem / (1024 * 1024));
        nO.freemem = parseInt(nO.freemem / (1024 * 1024));
        nO['free/total'] = nO['free/total'].toFixed(2);

        let time = new Date(nO.Time);
        nO.Time = time.Format('MM-dd hh:mm');
        nO.nodes = nodes;
        ret.push(nO);
      }

      return ret;
    }
  },
  created () {
    this.setSexpContext('all');
    this.getServiceList();
  },
  mounted () {
  },
  methods: {
    async getServiceList () {
      let servers = this.$store.getters.sexpServers;
      for (let key in servers) {
        let info = servers[key];
        info.runStatus = true;
        this.servers.push(info);
      }
    }
  }
};
</script>

<style lang="less" scoped>

</style>
