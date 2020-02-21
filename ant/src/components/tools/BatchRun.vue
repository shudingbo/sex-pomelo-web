<template>
  <a-popover
    v-model="runGroup.visable"
    placement="bottomRight"
    overlayClassName="header-notice-wrapper"
    :autoAdjustOverflow="true"
    :arrowPointAtCenter="true"
    :overlayStyle="{ width: '400px', top: '50px' }"
  >
    <template slot="content">
      <h4>{{`Action: ${batchInfo.action} Servers`}}</h4>
      <a-table  :dataSource="batchInfo.servers" rowKey="serverId" :scroll="{y: 500 }" size="small" :pagination="false">
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
    </template>
    <a-badge :count="batchInfo.leftCnt">
      <a-icon type="bars" @click="runGroup.visable=!runGroup.visable" style="font-size: 16px; padding: 4px"/>
    </a-badge>
  </a-popover>
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
      console.log('bInfo');
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

  }
};
</script>
<style lang="css">
  .header-notice-wrapper {
    top: 50px !important;
  }
</style>
