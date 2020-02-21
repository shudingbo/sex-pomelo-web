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
    <span @click="showTerminal" class="header-notice" style="padding: 0 0px">
      <a-icon style="font-size: 16px; padding: 4px" type="code" />
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
      case 'use':
        {
          let len = commandArgs.length;
          if (len === 2) {
            this.setSexpContext(commandArgs[1]);
            this.sign = this.getSexpContext() + '$';
            this.context = this.getSexpContext();
          } else if (len === 1) {
            this.sendCmd(command);
          } else {
            let msg = '\\color:#FF8033; Error use cmd';
            this.terminal.$emit('write', msg);
          }
        } break;
      case 'monitorLog':
        this.sendCmd(command, (msg) => {
          let lines = msg.split('\n');
          for (let it of lines) {
            let de = it.split(' ');
            de[0] = de[0].substring(1, 20);
            let color = this.getColor(de[1]);
            this.terminal.$emit('write', color + de[0] + ' ' + de.slice(2).join(' '));
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
            msg = '\\color:#FF8033; ' + msg;
          }
        }
        msg = msg.replace(/<p>/g, '');
        msg = msg.replace(/<\/p>/g, '\n');
        if (typeof (cb) === 'function') {
          cb(msg);
        } else {
          this.terminal.$emit('write', msg);
        }
      }).catch((err) => {
        let msg = '\\color:#FF8033; ' + err.toString();
        this.terminal.$emit('write', msg);
      });
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
