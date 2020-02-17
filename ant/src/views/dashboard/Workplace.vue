<template>
  <div>

    <a-tabs defaultActiveKey="sysG">
      <template slot="tabBarExtraContent">
        <a-button icon="plus" @click="dlgAddVisable=true;dlgAddEdit=true;" type="primary" size="small" title="Add Server">Add</a-button>
        <a-button icon="plus-square" style="margin-left:6px;" @click="dlgAddBatchVisable=true" type="dashed" size="small" title="Batch Add Server">Add Batch</a-button>
      </template>
      <a-tab-pane tab="Graphics" key="sysG" forceRender>
        <div>
        <vue-system-graph ref="sysGraph" forceRender/>
        </div>
      </a-tab-pane>
      <a-tab-pane tab="Table" key="sysT" forceRender>
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

    <a-modal :visible="dlgAddVisable" title="Add Server" @ok="onHandlerDlgOk"  @cancel="()=>{dlgAddVisable=false}">
      <a-form-item  label="serverId" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input v-model='addSer.serverId' placeholder="Server Id" :disabled="!dlgAddEdit"></a-input>
      </a-form-item>
      <a-form-item  label="serverType" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input v-model='addSer.serverType' placeholder="Server type" :disabled="!dlgAddEdit"></a-input>
      </a-form-item>
      <a-form-item  label="host" :label-col="formTailLayout.labelCol"  :wrapper-col="formTailLayout.wrapperCol">
        <a-input v-model="addSer.host" placeholder="IP address"></a-input>
      </a-form-item>
      <a-form-item  label="port" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input-number v-model="addSer.port" :min='1000'>
        </a-input-number>
      </a-form-item>
      <a-form-item label="frontend" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-switch v-model="addSer.frontend" checkedChildren="frontend" unCheckedChildren="backend" :disabled="!dlgAddEdit"></a-switch>
      </a-form-item>
      <a-form-item v-if="addSer.frontend" label="clientPort" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input-number v-model="addSer.clientPort" :min='1000'>
        </a-input-number>
      </a-form-item>
    </a-modal>
    <a-modal :visible="dlgAddBatchVisable" title="Batch Add Server" @ok="addServerBatch"  @cancel="()=>{dlgAddBatchVisable=false}">
      <a-textarea v-model="txtBatchAdd" :autosize="{ minRows: 3,maxRows:20 }"
        placeholder="cp servers.json in text"
      >
      </a-textarea>
    </a-modal>
  </div>
</template>

<script>
import { axios } from '@/utils/request';
import SystemGraph from '@/components/tools/SystemGraph';
import G6 from '@antv/g6';

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

const formItemLayout = {
  labelCol: { span: 7 },
  wrapperCol: { span: 8 }
};
const formTailLayout = {
  labelCol: { span: 7 },
  wrapperCol: { span: 8, offset: 4 }
};

export default {
  name: 'Workplace',
  components: {
    'vue-system-graph': SystemGraph
  },
  data () {
    return {
      servers: [],
      sysColumns,
      nodeColums,
      filter: [''],
      formItemLayout,
      formTailLayout,
      dlgAddVisable: false,
      dlgAddEdit: true, // true 表示是添加; false表示更新
      addSer: {
        serverId: 'aaa-1',
        serverType: 'aaa',
        host: '127.0.0.1',
        port: 10000,
        frontend: false,
        clientPort: 0
      },
      curSelNode: null,
      dlgAddBatchVisable: false,
      txtBatchAdd: ''
    };
  },
  computed: {
    sysMapArr () {
      let o = this.$store.getters.sexpSystemMap;

      let ret = [];
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
        this.servers.push(servers[key]);
      }
    },

    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },

    async addServer () {
      let cfg = this.addSer;
      if (typeof (cfg.serverId) !== 'string' || cfg.serverId.length < 3) {
        this.$message.warn('serverId error');
        return;
      }

      if (typeof (cfg.serverType) !== 'string' || cfg.serverType.length < 2) {
        this.$message.warn('serverType error');
        return;
      }

      if (cfg.serverId.indexOf(cfg.serverType) === -1) {
        this.$message.warn('serverId must include serverType string. <serverType>-<some str>');
        return;
      }

      if (typeof (cfg.host) !== 'string' || cfg.host.length < 7) {
        this.$message.warn('host error');
        return;
      }

      let curServers = this.$store.getters.sexpServers;
      if (curServers[cfg.serverId] !== undefined) {
        this.$message.warn(`Server ${cfg.serverId} has exits!`);
        return;
      }

      const resp = await axios({
        url: '/regServer',
        method: 'post',
        data: cfg
      });

      if (resp.status === 'success') {
        await this.$store.dispatch('AddServer', cfg);
        this.dlgAddVisable = false;
      }

      this.$message[resp.status](resp.message);
    },
    async addServerBatch () {
      let cont = this.txtBatchAdd;
      let addServers = {};
      try {
        let servers = JSON.parse(cont);
        let hasServers = this.$store.getters.sexpServers;
        let production = {};
        for (let env in servers) {
          if (env === 'production') {
            production = servers[env];
            continue;
          }

          for (let type in servers[env]) {
            for (let ser of servers[env][type]) {
              if (hasServers[ser.id] === undefined) {
                let { id: serverId, host, port, clientPort, frontend } = ser;
                addServers[ser.id] = {
                  serverId, serverType: type, host, port, clientPort, frontend
                };
              }
            }
          }
        }

        for (let type in production) {
          for (let ser of production[type]) {
            if (hasServers[ser.id] === undefined) {
              let { id: serverId, host, port, clientPort, frontend } = ser;
              addServers[ser.id] = {
                serverId, serverType: type, host, port, clientPort, frontend
              };
            }
          }
        }
      } catch (err) {
        this.$message.warn(err);
        return;
      }

      if (Object.keys(addServers).length === 0) {
        this.$message.warn('No Server should be add!');
        return;
      }

      const resp = await axios({
        url: '/regServerBatch',
        method: 'post',
        data: addServers
      });

      if (resp.status === 'success') {
        let cfgs = [];

        for (let it in resp.data) {
          cfgs.push(JSON.parse(resp.data[it]));
        }
        await this.$store.dispatch('AddServer', cfgs);
        this.dlgAddBatchVisable = false;
      }

      this.$message[resp.status](resp.message);
    },
    async stopServer (ser) {
      let ret = await this.$store.dispatch('StopServer', ser.serverId);
      if (ret.status === 'success') {

      }
      this.axiosMsg(ret);
    },
    async startServer (ser) {
      let ret = await this.$store.dispatch('StartServer', ser);
      if (ret.status === 'success') {

      }
      this.axiosMsg(ret);
    },
    async deleteServer (ser) {
      let ret = await this.$store.dispatch('DeleteServer', ser.serverId);
      if (ret.status === 'success') {
        this.curSelNode = null;
      }

      this.$message[ret.status](ret.message);
    },
    showEditDlg (ser) {
      this.dlgAddEdit = false;

      let { serverId, serverType, host, port, frontend, clientPort } = ser;
      this.addSer.serverId = serverId;
      this.addSer.serverType = serverType;
      this.addSer.host = host;
      this.addSer.port = port;
      this.addSer.frontend = frontend;
      this.addSer.clientPort = clientPort;

      this.dlgAddVisable = true;
    },
    async editServer () {
      let newCfg = this.addSer;
      let ret = await this.$store.dispatch('UpdateServer', newCfg);
      if (ret.status === 'success') {

      }
      this.$message[ret.status](ret.message);
    },
    async onHandlerDlgOk () {
      if (this.dlgAddEdit) {
        this.addServer();
      } else {
        this.editServer();
      }
    }

  }
};
</script>

<style>
.g6-tooltip {
  border: 1px solid #e2e2e2;
  border-radius: 4px;
  font-size: 12px;
  color: #545454;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;
}
.ant-tabs-bar {
  margin: 0 0 6px 0;
}

li{ list-style: none;}
ul{margin:0px;padding:0px}

</style>
