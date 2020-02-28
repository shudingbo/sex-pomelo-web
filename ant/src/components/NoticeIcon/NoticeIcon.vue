<template>
  <div>
    <a-drawer
        width="60%"
        placement="right"
        @close="visible=false"
        :closable="false"
        :visible="visible"
      >
      <vue-terminal-ui
        ref="terminal-ui"
        :prefix="sign"
        :noSplit="true"
        :initMessage="ASCII_LOGO"
        @triggerCommand="execute" />
    </a-drawer>
    <span class="header-notice" style="padding: 0 0px">

      <a-dropdown-button @click="showTerminal" size="small" type="dashed">
        <a-icon type="code" />{{curMasterAlias}}
        <a-menu slot="overlay" @click="handleChangeMaster">
          <a-menu-item v-for="v in masters"
            :key="`${v.alias}`"
          >
          {{v.alias}}
          </a-menu-item>
          <a-menu-divider />
        </a-menu>
      </a-dropdown-button>
    </span>
  </div>
</template>

<script>

import VueTerminalUI from '@/components/tools/VueTerminalUI';
import { axios } from '@/utils/request';

const ASCII_LOGO = [
  '- https://github.com/sex-pomelo/sex-pomelo',
  '- npm install @sex-pomelo/sex-pomelo'
];

export default {
  name: 'HeaderNotice',
  components: {
    'vue-terminal-ui': VueTerminalUI
  },
  data () {
    return {
      loading: false,
      visible: false,
      intro: 'welcome sex-pomelo-cli',
      sign: '$',
      context: 'all',
      ASCII_LOGO
    };
  },
  computed: {
    terminal () {
      return this.$refs['terminal-ui'];
    },
    curMaster () {
      return this.$store.getters.sexpCurMaster;
    },
    curMasterAlias () {
      return this.$store.getters.sexpCurMasterAlia;
    },
    masters () {
      return this.$store.getters.sexpMasters;
    }

  },
  methods: {
    showTerminal () {
      this.sign = this.getSexpContext() + '$';
      this.context = this.getSexpContext();
      this.visible = true;
    },
    execute (command, args) {
      console.log('-> send cmd:', command, args);

      let commandArgs = command.trim().split(/(?<!\\) /g);
      switch (commandArgs[0]) {
      case 'master':
        {
          let msg = '\\color:#8080FF; Current Master is: ' + this.curMaster;
          this.terminal.$emit('write', msg);
        } break;
      case 'use':
        {
          let len = commandArgs.length;
          if (len === 2) {
            let c = this.$store.getters.sexpServers;
            let serIds = [];
            for (let it in c) {
              if (c[it].runStatus === true) {
                serIds.push(it);
              }
            }

            if (commandArgs[1] !== 'all' && serIds.indexOf(commandArgs[1]) === -1) {
              let msg = `\\color:#FF8033; server ${commandArgs[1]} not exists`;
              this.terminal.$emit('write', msg);
            } else {
              this.setSexpContext(commandArgs[1]);
              this.sign = this.getSexpContext() + '$';
              this.context = this.getSexpContext();
            }
          } else if (len === 1) {
            this.sendCmd(command);
          } else {
            let msg = '\\color:#FF8033; Error use cmd';
            this.terminal.$emit('write', msg);
          }
        } break;
      case 'monitorLog':
        this.sendCmd(command, (msg, status) => {
          if (status === 'error') {
            let msgErr = '\\color:#FF8033; ' + msg;
            this.terminal.$emit('write', msgErr);
          } else {
            if (msg === 'success') {
              this.terminal.$emit('write', 'no data');
            } else {
              let lines = msg.split('\n');
              for (let it of lines) {
                let de = it.split(' ');
                de[0] = de[0].substring(1, 20);
                let color = this.getColor(de[1]);
                this.terminal.$emit('write', color + de[0] + ' ' + de.slice(2).join(' '));
              }
            }
          }
        });
        break;
      case 'clear':
        this.terminal.$emit('clearHistory');
        break;
      default:
        this.sendCmd(command);
        break;
      }
    },
    getColor (lv) {
      if (lv === '[INFO]') {
        return '\\color:#00BFFF;';
      } else if (lv === '[WARN]') {
        return '\\color:#FFBF00;';
      } else if (lv === '[ERROR]') {
        return '\\color:#FE2E2E;';
      }

      return '';
    },
    sendCmd (command, cb) {
      axios({
        url: '/pomelo',
        method: 'get',
        params: { cmd: command, context: this.context }
      }).then((res) => {
        let msg = res.message;
        if (res.status === 'success') {
          if (res.data) {
            try {
              if (typeof (res.data) === 'string') {
                if (typeof (cb) !== 'function') {
                  msg = '\\color:#8080FF; ' + res.data;
                } else {
                  msg = res.data;
                }
              } else if (Object.keys(res.data).length !== 0) {
                msg = JSON.stringify(res.data, null, 1);
                if (typeof (cb) !== 'function') {
                  msg = '\\color:#0080FF; ' + msg;
                }
              }
            } catch (e) {
              msg = res.data;
            }
          }
        } else {
          if (typeof (cb) !== 'function') {
            if (typeof (msg) === 'object') {
              msg = JSON.stringify(msg, null, 1);
            }
            msg = '\\color:#FF8033; ' + msg;
          }
        }
        msg = msg.replace(/<p>/g, '');
        msg = msg.replace(/<\/p>/g, '\n');
        if (typeof (cb) === 'function') {
          cb(msg, res.status);
        } else {
          this.terminal.$emit('write', msg);
        }
      }).catch((err) => {
        let msg = '\\color:#FF8033; ' + err.toString();
        this.terminal.$emit('write', msg);
      });
    },
    handleChangeMaster (e) {
      let selMasterAlias = e.key;
      if (selMasterAlias !== this.curMasterAlias) {
        this.$store.dispatch('ChangeMaster', selMasterAlias);
      }
    }
  }
};
</script>

<style lang="css">
  .header-notice-wrapper {
    top: 50px !important;
  }
</style>
<style lang="less" scoped>
  .header-notice{
    display: inline-block;
    transition: all 0.3s;

    span {
      vertical-align: initial;
    }
  }
</style>
