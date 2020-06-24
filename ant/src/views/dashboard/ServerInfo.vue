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
            <tr><td class="colName">uptime(m)</td><td class="colVal"><a-tag>{{ serInfo.uptime}}</a-tag></td></tr>
            <tr><td class="colName">pid</td><td class="colVal"><a-tag>{{serInfo.pid}}</a-tag></td></tr>
            <tr><td class="colName">heapUsed(M)</td><td class="colVal"><a-tag>{{ serInfo.heapUsed}}</a-tag></td></tr>
            <tr><td class="colName">cpuAvg</td><td class="colVal"><a-tag>{{ serInfo.cpuAvg}}</a-tag></td></tr>
            <tr><td class="colName">memAvg</td><td class="colVal"><a-tag>{{ serInfo.memAvg}}</a-tag></td></tr>
            <tr><td class="colName">vsz(M)</td><td class="colVal"><a-tag>{{ parseInt(serInfo.vsz/1024/1024)}}</a-tag></td></tr>
            <tr><td class="colName">rss(M)</td><td class="colVal"><a-tag>{{ parseInt(serInfo.vsz/1024/1024)}}</a-tag></td></tr>
            <tr><td class="colName">usr(M)</td><td class="colVal"><a-tag>{{ parseInt(serInfo.usr/1024/1024)}}</a-tag></td></tr>
            <tr><td class="colName">sys</td><td class="colVal"><a-tag>{{ serInfo.sys}}</a-tag></td></tr>
            <tr><td class="colName">gue</td><td class="colVal"><a-tag>{{ serInfo.gue}}</a-tag></td></tr>
          </table>
        </a-card>
      </a-col>
      <a-col :span="18">
        <a-tabs defaultActiveKey="connect" type="card" @change="tabChanged" >
          <a-tab-pane tab="Base Info" key="base">
            <a-tabs tabPosition="top" defaultActiveKey="Handler" >
              <a-tab-pane tab="Handler" key="Handler">
                <codemirror :options="cmOptions"
                  :value="JSON.stringify(detailInfo.handler,null,2)"
                  @ready="onCmReady"
                />
              </a-tab-pane>
              <a-tab-pane tab="Modules" key="Modules">
                <codemirror :options="cmOptions"
                  :value="JSON.stringify(detailInfo.modules,null,2)"
                  @ready="onCmReady"
                />
              </a-tab-pane>
              <a-tab-pane tab="Components" key="Components">
                <codemirror :options="cmOptions"
                  :value="JSON.stringify(detailInfo.components,null,2)"
                  @ready="onCmReady"
                />
              </a-tab-pane>
              <a-tab-pane tab="Settings" key="Settings">
                <codemirror :options="cmOptions"
                  :value="JSON.stringify(detailInfo.settings,null,2)"
                  @ready="onCmReady"
                />
              </a-tab-pane>
              <a-tab-pane tab="Proxy" key="Proxy">
                <codemirror :options="cmOptions"
                  :value="JSON.stringify(detailInfo.proxy,null,2)"
                  @ready="onCmReady"
                />
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
          <a-tab-pane v-if="serInfo.frontend" tab="Connections" key="connect">
            <a-card :bordered="false">
              <a-table :dataSource="loginInfo.loginedList" :pagination="false" bordered >
                <template slot="title">{{ loginInfo.serverId }} - <a-tag color="blue">{{ loginInfo.loginedCount }}</a-tag></template>
                <a-table-column title="uid*room" dataIndex="uid" key="uid" />
                <a-table-column title="loginTime" dataIndex="loginTime" key="loginTime">
                  <template slot-scope="text"><span>{{ text| DateFormat('yyyy-MM-dd hh:mm:ss') }}</span></template>
                </a-table-column>
                <a-table-column title="address" dataIndex="address" key="address" />
                <a-table-column title="操作"  key="action">
                  <template slot-scope="text, record">
                    <a-tag color="red" @click="kickUser(record)">踢出</a-tag>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>
            <!-- <codemirror :options="cmOptions"
                :value="JSON.stringify(loginInfo, null,1)"
                @ready="onCmReady"
            /> -->
          </a-tab-pane>
          <a-tab-pane tab="Script" key="script">
            <a-form :label-col="{ span: 2 }" :wrapper-col="{ span: 12 }">
              <a-form-item label="适用范围">
                <a-select v-model="scriptDetail.type" @change="getScript">
                  <a-select-option value="all">所有</a-select-option>
                  <a-select-option value="front">前端</a-select-option>
                  <a-select-option value="backend">后端</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="脚本名称">
                <a-auto-complete
                  :dataSource="typeKeys"
                  @select="selectScript"
                  @search="searchScript"
                  @focus="typeKeys=[]"
                  v-model="scriptDetail.name"
                />
                <a-input v-model="scriptDetail.name" placeholder="请输入脚本名称" hidden/>
              </a-form-item>
              <a-form-item label="脚本内容">
                <codemirror :options="cmScriptOptions"
                  v-model="scriptDetail.content"
                  @ready="onCmReady" />
              </a-form-item>
              <a-form-item :wrapper-col="{ span: 12, offset: 2 }">
                <a-button type="primary" v-if="scriptDetail.isSaved" @click="execScript">执行脚本</a-button>
                <a-button type="primary" @click="saveScript" v-else>保存脚本</a-button>
              </a-form-item>
            </a-form>

          </a-tab-pane>
          <a-tab-pane tab="Monitor Log" key="MonitorLog">
            <a-button type="primary" @click="getLogs">获取日志</a-button>
            <codemirror :options="cmOptions"
                :value="monitorLog"
                @ready="onCmReady"
            />
          </a-tab-pane>
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
import { codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/addon/edit/matchbrackets.js';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/search/searchcursor.js';
// import 'codemirror/addon/display/fullscreen.css';
// import 'codemirror/addon/display/fullscreen.js';

// import 'codemirror/keymap/vim.js';

import 'codemirror/theme/mbo.css';

import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/edit/matchtags';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import { message } from 'ant-design-vue';

export default {
  name: 'ServerInfo',
  components: {
    codemirror
  },
  data () {
    return {
      serverId: '',
      loginInfo: {},
      monitorLog: '',
      savedScripts: {},
      scriptKeys: {},
      typeKeys: [],
      autoOpen: false,
      scriptDetail: {
        type: 'all',
        name: '',
        content: '',
        isSaved: false
      },
      scriptType: [{ value: 'all', label: '所有' }, { value: 'frontend', label: '前端' }, { value: 'backend', label: '后端' }],
      form: this.$form.createForm(this),
      // scriptContext: 'var cpus = os.cpus();\nresult = util.inspect(cpus,true,null);',
      cmOptions: {
        // codemirror options
        tabSize: 2,
        styleActiveLine: true,
        styleSelectedText: true,
        height: 600,
        mode: 'application/json',
        theme: 'mbo',
        lineNumbers: true,
        lineWrapping: true,
        line: true,
        // keyMap: 'vim',
        readOnly: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        extraKeys: {
          // 'F11': function (cm) {
          //   cm.setOption('fullScreen', !cm.getOption('fullScreen'));
          // },
          // 'Esc': function (cm) {
          //   if (cm.getOption('fullScreen')) cm.setOption('fullScreen', false);
          // }
        },
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        // more codemirror options, 更多 codemirror 的高级配置...
      },
      cmScriptOptions: {
        // codemirror options
        tabSize: 2,
        styleActiveLine: true,
        styleSelectedText: true,
        height: 600,
        mode: 'text/javascript',
        theme: 'mbo',
        lineNumbers: true,
        lineWrapping: true,
        line: true,
        // keyMap: 'vim',
        matchBrackets: true,
        showCursorWhenSelecting: true,
        extraKeys: {
          // 'F11': function (cm) {
          //   cm.setOption('fullScreen', !cm.getOption('fullScreen'));
          // },
          // 'Esc': function (cm) {
          //   if (cm.getOption('fullScreen')) cm.setOption('fullScreen', false);
          // }
        },
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        // more codemirror options, 更多 codemirror 的高级配置...
      }
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
    },
    onCmReady (cm) {
      cm.setSize('auto', '500px');
    },
    async saveScript () {
      console.log(this.scriptDetail);
      const script = this.scriptDetail;
      if (script.name === '' || script.content === '') {
        message.error('请输入脚本内容');
      } else {
        const res = await axios({
          url: '/saveScript',
          method: 'post',
          data: script
        });
        if (res.code === 0) {
          message.success('添加成功');
        }
      }
    },
    searchScript (value) {
      if (!value) return false;
      const onlyKey = [];
      for (const item of this.scriptKeys[this.scriptDetail.type]) {
        if (item.includes(value)) onlyKey.push(item);
      }
      this.typeKeys = onlyKey;
    },
    selectScript (value) {
      this.scriptDetail.content = this.savedScripts[this.scriptDetail.type][value];
      this.scriptDetail.isSaved = true;
    },
    async getScript () {
      const type = this.scriptDetail.type;
      const res = await axios({
        url: '/getScript',
        method: 'get',
        params: { type }
      });
      if (res.code !== 0) {
        message.error('获取脚本失败');
      } else {
        const data = res.data;
        this.savedScripts[type] = data;
        const keys = [];
        for (const key in data) {
          keys.push(key);
        }
        this.scriptKeys[type] = keys;
      }
    },
    async tabChanged (key) {
      if (key === 'script') {
        await this.getScript();
      }
    },
    async execScript () {
      const cmd = this.scriptDetail.content;
      const ret = await axios({
        url: '/execScript',
        method: 'get',
        params: { cmd, context: this.serInfo.serverId }
      });
      console.log(ret);
    },
    kickUser (record) {
      console.log(record);
    },
    async getLogs () {
      const res = await axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: `monitorLog`, context: this.serInfo.serverId }
      });
      console.log(res);
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
  margin: 0px;
  text-align: left;
  padding-top: 8px;
}
</style>
