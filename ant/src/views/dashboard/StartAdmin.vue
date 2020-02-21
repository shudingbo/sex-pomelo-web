<template>
  <div>
    <a-card title="Start List">
      <div slot="extra">
        <a-select style="width: 120px;margin-right:6px;" placeholder="选择分组"
          v-model="curSelGroup" @change="onGroupSelChange"
        >
          <a-select-option v-for="(v,k) in startGroup" :key="k" :value="k">{{k}}</a-select-option>
        </a-select>
        <a-button size="small" type="primary" icon="save" style="margin-right:6px;" title="Save Current Group" @click="onSaveGroup"></a-button>
        <a-button size="small" type="dashed" icon="save" style="margin-right:6px;" title="Save As" @click="showSaveAsDlg"></a-button>
        <a-popconfirm v-if="curSelGroup.length > 0" :title="`Sure to Delete ${this.curSelGroup}`" @confirm="() => onDeleteGroup()">
            <a-button size="small" type="danger" icon="close" title="Delete Current Group"></a-button>
        </a-popconfirm>
        <a-divider type="vertical"/>
        <a-popconfirm v-if="curSelGroup.length > 0" :title="`Sure to Stop ${this.curSelGroup}`" @confirm="() => onStopGroup()">
          <a-button :disabled="batchInfo.isRun" size="small" type="primary" icon="poweroff" style="margin-right:6px;" title="Stop Current Group"></a-button>
        </a-popconfirm>
        <a-popconfirm v-if="curSelGroup.length > 0" :title="`Sure to Start ${this.curSelGroup}`" @confirm="() => onStartGroup()">
          <a-button :disabled="batchInfo.isRun" size="small" type="danger" icon="caret-right" title="Start Current Group"></a-button>
        </a-popconfirm>
        <a-divider type="vertical" v-if="curSelGroup.length > 0"/>
        <a-input-search
            placeholder="筛选"
            v-model="filter[0]"
            style="width:120px;margin-right:5px">
        </a-input-search>
        <a-radio-group v-model="displayStyle" buttonStyle="solid" size="small">
          <a-radio-button value="all">all</a-radio-button>
          <a-radio-button value="chk">Check</a-radio-button>
          <a-radio-button value="unchk" icon="border">Uncheck</a-radio-button>
        </a-radio-group>
      </div>
      <a-table :columns="ServerCloumn" size="small" rowKey="serverId" bordered=""
        :dataSource="servers" :pagination="false"
        :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
      >
        <template slot="slTag" slot-scope="text,record">
          <a-tag :color="record.runStatus?'green':''"> {{ text}} </a-tag>
        </template>
        <template slot="slPort" slot-scope="text">
          <a-tag v-if="text>0" :color="text>0?'green':''"> {{ text}} </a-tag>
        </template>
        <template slot="slSerId" slot-scope="text,record">
          <router-link :to="{path:'/dashboard/serverinfo',query:record}" tag="a" target="_blank">
            <a-tag :color="record.runStatus?'green':''">{{text}}</a-tag>
          </router-link>
        </template>
        <template slot="slOper" slot-scope="text,record" v-if="record.serverType!='master'">
          <a-popconfirm v-if="record.runStatus" :title="`Sure to Stop ${record.serverId}`" @confirm="() => stopServer(record)">
            <a-button size="small" type="danger" icon="poweroff"></a-button>
          </a-popconfirm>
          <a-popconfirm v-if="!record.runStatus" :title="`Sure to Start ${record.serverId}`" @confirm="() => startServer(record)">
            <a-button size="small" type="primary" icon="caret-right"></a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>
    <a-modal :visible="dlgNewGroupVisable" title="Save as New Group" @ok="onSaveAsGroup" @cancel="()=>{dlgNewGroupVisable=false}">
      <a-input v-model="newGroupName"
        placeholder="input new groupName"
      >
      </a-input>
    </a-modal>
  </div>
</template>

<script>
import { axios } from '@/utils/request';
import Vue from 'vue';
export default {
  name: 'StartAdmin',
  components: {},
  data () {
    return {
      filter: [''],
      displayStyle: 'all', // all,chk,unchk
      selectedRowKeys: [],
      startGroup: {}, // 启动分组
      curSelGroup: '', // 当前选择分组
      dlgNewGroupVisable: false,
      newGroupName: '',
      hasChange: false
    };
  },
  computed: {
    ServerCloumn () {
      const ServerCloumn = [
        {
          title: 'serverId',
          dataIndex: 'serverId',
          scopedSlots: { customRender: 'slSerId' },
          filteredValue: this.filter || null,
          onFilter: (value, record) => {
            return this.filterFnNor(value, record);
          },
          sorter: (a, b) => a.serverId - b.serverId
        },
        { title: 'serverType', dataIndex: 'serverType', width: 140, sorter: (a, b) => a.serverType.localeCompare(b.serverType) },
        { title: 'host', dataIndex: 'host', sorter: (a, b) => a.host.localeCompare(b.host) },
        { title: 'port', dataIndex: 'port', sorter: (a, b) => a.port - b.port },
        { title: 'clientPort', dataIndex: 'clientPort', scopedSlots: { customRender: 'slPort' }, sorter: (a, b) => a.clientPort - b.clientPort },
        { title: 'frontend', dataIndex: 'frontend', sorter: (a, b) => { return ((a.frontend ? 1 : 0) - (b.frontend ? 1 : 0)); } },
        { title: 'pid', dataIndex: 'pid', sorter: (a, b) => a.pid - b.pid },
        { title: 'heapUsed(M)', dataIndex: 'heapUsed', sorter: (a, b) => a.heapUsed - b.heapUsed },
        { title: 'upTime(m)', dataIndex: 'uptime', sorter: (a, b) => a.upTime - b.upTime },
        { title: 'Operator', scopedSlots: { customRender: 'slOper' } }
      ];
      return ServerCloumn;
    },
    servers () {
      let sers = [];
      let servers = this.$store.getters.sexpServers;
      for (let key in servers) {
        let info = servers[key];
        if (info.serverType !== 'master') {
          sers.push(info);
        }
      }

      return sers;
    },
    batchInfo () {
      return this.$store.getters.sexpBatchInfo;
    }
  },
  created () {
    this.setSexpContext('all');
  },
  mounted () {
    this.getAllGroup();
  },
  methods: {
    async stopServer (serverInfo) {
      let serverId = serverInfo.serverId;
      const ret = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `stop ${serverId}` }
      });
      if (ret.status === 'success') {
        // serverInfo.runStatus = false;
      }

      this.axiosMsg(ret);
    },
    async startServer (serverInfo) {

    },
    filterFnNor (key, it) {
      let szServerID = it.serverId.toString();
      if (szServerID.indexOf(key) !== -1) {
        if (this.displayStyle === 'chk') {
          return (this.selectedRowKeys.indexOf(szServerID) !== -1);
        } else if (this.displayStyle === 'unchk') {
          return (this.selectedRowKeys.indexOf(szServerID) === -1);
        }

        return true;
      }

      if (it.serverType.indexOf(key) !== -1) {
        if (this.displayStyle === 'chk') {
          return (this.selectedRowKeys.indexOf(szServerID) !== -1);
        } else if (this.displayStyle === 'unchk') {
          return (this.selectedRowKeys.indexOf(szServerID) === -1);
        }
        return true;
      }

      if (this.displayStyle === 'chk') {
        return (this.selectedRowKeys.indexOf(szServerID) !== -1);
      } else if (this.displayStyle === 'unchk') {
        return (this.selectedRowKeys.indexOf(szServerID) === -1);
      }
      return false;
    },
    onSelectChange (selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
      this.hasChange = true;
    },
    onGroupSelChange (e) {
      this.setStore('sexp-cli:defaultGroup', e);
      this.selectedRowKeys = this.startGroup[e];
      this.hasChange = false;
    },
    async getAllGroup () {
      const res = await axios({
        url: '/getAllStartGroup',
        method: 'get',
        params: { }
      });

      if (res.status === 'success') {
        this.startGroup = res.data.group;
        let curGroup = this.getStore('sexp-cli:defaultGroup');
        if (curGroup !== null) {
          this.curSelGroup = curGroup;
          this.selectedRowKeys = this.startGroup[this.curSelGroup];
        }
      }
    },
    async onSaveGroup () {
      if (this.curSelGroup === '') {
        this.$message.info('当前没有选择分组，请选择分组或点击另存为保存新分组');
        return;
      }

      const res = await axios({
        url: '/saveStartGroup',
        method: 'post',
        data: { name: this.curSelGroup, data: this.selectedRowKeys }
      });

      if (res.status === 'success') {
        this.startGroup[this.curSelGroup] = [...this.selectedRowKeys];
        this.hasChange = false;
      }

      this.$message[res.status](res.message);
    },
    async onSaveAsGroup () {
      if (this.newGroupName.length < 2) {
        this.$message.warn('group name length max more than 3');
        return;
      }

      if (this.startGroup[this.newGroupName] !== undefined) {
        this.$message.warn(`${this.newGroupName} has exist!`);
        return;
      }

      const res = await axios({
        url: '/saveStartGroup',
        method: 'post',
        data: { name: this.newGroupName, data: this.selectedRowKeys }
      });

      if (res.status === 'success') {
        this.startGroup[this.newGroupName] = [...this.selectedRowKeys];
        this.curSelGroup = this.newGroupName;
        this.setStore('sexp-cli:defaultGroup', this.newGroupName);
        this.dlgNewGroupVisable = false;
      }
    },
    showSaveAsDlg () {
      this.dlgNewGroupVisable = true;
    },
    async onDeleteGroup () {
      if (this.curSelGroup === '') {
        this.$message.info('当前没有选择分组，请选择分组');
        return;
      }

      const res = await axios({
        url: '/deleteStartGroup',
        method: 'delete',
        data: { name: this.curSelGroup }
      });

      if (res.status === 'success') {
        delete this.startGroup[ this.curSelGroup ];
        this.curSelGroup = '';
        this.selectedRowKeys = [];
      }

      this.$message[res.status](res.message);
    },
    async onStartGroup () {
      if (this.curSelGroup === '') {
        this.$message.info('当前没有选择分组，请选择分组');
        return;
      }

      if (this.hasChange) {
        this.$message.info('当前分组没有保存，请先保存分组');
        return;
      }
      if (this.startGroup[this.curSelGroup].length === 0) {
        return;
      }

      this.$store.dispatch('BatchRunAction', { action: 'start', serverIds: this.startGroup[this.curSelGroup] });
    },
    async onStopGroup () {
      if (this.curSelGroup === '') {
        this.$message.info('当前没有选择分组，请选择分组');
        return;
      }

      if (this.hasChange) {
        this.$message.info('当前分组没有保存，请先保存分组');
        return;
      }

      if (this.startGroup[this.curSelGroup].length === 0) {
        return;
      }

      this.$store.dispatch('BatchRunAction', { action: 'stop', serverIds: this.startGroup[this.curSelGroup] });
    }
  }
};
</script>

<style>
.ant-card-body {
    padding: 6px;
    zoom: 1;
}
</style>
