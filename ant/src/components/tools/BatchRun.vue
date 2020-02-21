<template>
  <div>
    <a-badge :count="batchInfo.leftCnt">
      <a-icon type="bars" @click="runGroup.visable=true"></a-icon>
    </a-badge>
    <a-modal :visible="runGroup.visable" :title="`${batchInfo.action} Servers`"
      style="top: 20px;"
      :bodyStyle="{padding: 0}"
      @ok="()=>{runGroup.visable=false}"
      @cancel="()=>{runGroup.visable=false}"
    >
      <template slot="footer">
        <a-button key="submit" type="primary" @click="()=>{runGroup.visable=false}">关闭</a-button>
      </template>
      <a-table :dataSource="batchInfo.servers" rowKey="serverId" :scroll="{y: 500 }" size="small">
          <a-table-column title="ServerId" dataIndex="serverId" key="serverId" >
            <template slot-scope="text, record">
              <a-tag :color="record.runStatus?'green':''">{{text}}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="actionSta" dataIndex="actionSta" key="actionSta" >
            <template slot-scope="text, record">
              <span v-if="record.actionSta===0"><a-icon type="minus" :style="{color:'blue'}"></a-icon> Wait Handler... </span>
              <span v-else-if="record.actionSta===1"><a-icon  type="check" :style="{color:'green'}"></a-icon> Success</span>
              <span v-else-if="record.actionSta===3"><a-icon  type="info" :style="{color:'gray'}"></a-icon> Ignore</span>
              <span v-else><a-icon type="close" :style="{color:'red'}"></a-icon> Error</span>
            </template>
          </a-table-column>
      </a-table>
    </a-modal>
  </div>
</template>

<script>
import { axios } from '@/utils/request';

export default {
  name: 'BatchRun',
  components: {

  },
  data () {
    return {
      runGroup: {
        visable: false
      }
    };
  },
  computed: {
    batchInfo () {
      let bInfo = this.$store.getters.sexpBatchInfo;
      if (bInfo.isRun === true) {
        this.runGroup.visable = true;
      }
      return bInfo;
    }
  },
  created () {
  },
  mounted () {

  },
  methods: {
    // async startGroup (serverIds) {
    //   if (this.batchInfo.isRun) {
    //     this.runGroup.visable = true;
    //     return;
    //   }

    //   if (serverIds.length === 0) {
    //     return;
    //   }

    //   this.runGroup.visable = true;
    //   this.$store.dispatch('BatchStartServer', serverIds);
    // },
    // async stopGroup (serverIds) {
    //   if (this.batchInfo.isRun) {
    //     this.runGroup.visable = true;
    //     return;
    //   }

    //   if (serverIds.length === 0) {
    //     return;
    //   }

    //   this.runGroup.visable = true;
    //   this.$store.dispatch('BatchStopServer', serverIds);
    // },
    // async show () {
    //   this.runGroup.visable = true;
    // }

  }
};
</script>
