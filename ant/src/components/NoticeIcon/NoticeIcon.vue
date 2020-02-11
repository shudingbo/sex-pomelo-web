<template>
  <div>
    <a-drawer
        width="600"
        placement="right"
        @close="visible=false"
        :closable="true"
        :visible="visible"
      >
      <vue-terminal-ui
        ref="terminal-ui"
        :prefix="sign"
        :noSplit="true"
        :initMessage="ASCII_LOGO"
        @triggerCommand="execute" />
      <!-- <div :style="{ position: 'absolute', left: 0, bottom: 0,width: '100%',borderTop: '1px solid #e9e9e9',
        padding: '10px 16px',background: '#fff',textAlign: 'right',}"
      >
      </div> -->
    </a-drawer>
    <span @click="showTerminal" class="header-notice" style="padding: 0 18px">
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
  created () {
    console.log('created');
  },
  mounted () {
    console.log('mou');
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
      switch (command) {
      case 'clear':
        this.terminal.$emit('clearHistory');
        break;
      default:
        axios({
          url: '/pomelo',
          method: 'get',
          params: { cmd: command, context: this.context }
        }).then((res) => {
          console.log(res);
          let msg = res.message;
          if (res.status === 'success') {
            if (res.data) {
              try {
                msg = JSON.stringify(res.data, null, 1);
                msg = '\\color:#0080FF; ' + msg;
              } catch (e) {
                msg = res.data;
              }
            }
          }
          msg = msg.replace(/<p>/g, '');
          msg = msg.replace(/<\/p>/g, '\n');
          this.terminal.$emit('write', msg);
        }).catch((err) => {
          this.terminal.$emit('write', err);
        });
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
