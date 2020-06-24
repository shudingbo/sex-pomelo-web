<template>
  <div class="page-header-index-wide">
    <a-row :gutter="24">

    </a-row>

    <a-card :loading="loading" :bordered="false" :body-style="{padding: '0'}">

    </a-card>

    <div class="antd-pro-pages-dashboard-analysis-twoColLayout" :class="isDesktop() ? 'desktop' : ''">
    </div>
  </div>
</template>

<script>
import { mixinDevice } from '@/utils/mixin';

export default {
  name: 'Analysis',
  mixins: [mixinDevice],
  components: {
  },
  data () {
    return {
      loading: true
    };
  },
  created () {
    setTimeout(() => {
      this.loading = !this.loading;
    }, 1000);
  }
};
</script>

<style lang="less" scoped>
  .extra-wrapper {
    line-height: 55px;
    padding-right: 24px;

    .extra-item {
      display: inline-block;
      margin-right: 24px;

      a {
        margin-left: 24px;
      }
    }
  }

  .antd-pro-pages-dashboard-analysis-twoColLayout {
    position: relative;
    display: flex;
    display: block;
    flex-flow: row wrap;
  }

  .antd-pro-pages-dashboard-analysis-salesCard {
    height: calc(100% - 24px);
    /deep/ .ant-card-head {
      position: relative;
    }
  }

  .dashboard-analysis-iconGroup {
    i {
      margin-left: 16px;
      color: rgba(0,0,0,.45);
      cursor: pointer;
      transition: color .32s;
      color: black;
    }
  }
  .analysis-salesTypeRadio {
    position: absolute;
    right: 54px;
    bottom: 12px;
  }
</style>
