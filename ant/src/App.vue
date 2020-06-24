<template>
  <a-config-provider :locale="locale" v-if="isRouterAlive">
    <div id="app">
      <router-view/>
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN';
import { deviceEnquire, DEVICE_TYPE } from '@/utils/device';

export default {
  provide () {
    return {
      reload: this.reload
    };
  },
  data () {
    return {
      locale: zhCN,
      isRouterAlive: true
    };
  },
  mounted () {
    const { $store } = this;
    deviceEnquire(deviceType => {
      switch (deviceType) {
      case DEVICE_TYPE.DESKTOP:
        $store.commit('TOGGLE_DEVICE', 'desktop');
        $store.dispatch('setSidebar', true);
        break;
      case DEVICE_TYPE.TABLET:
        $store.commit('TOGGLE_DEVICE', 'tablet');
        $store.dispatch('setSidebar', false);
        break;
      case DEVICE_TYPE.MOBILE:
      default:
        $store.commit('TOGGLE_DEVICE', 'mobile');
        $store.dispatch('setSidebar', true);
        break;
      }
    });
  },
  methods: {
    reload () {
      this.isRouterAlive = false;
      this.$nextTick(function () {
        this.isRouterAlive = true;
      });
    }
  }
};
</script>
<style>
#app {
  height: 100%;
}
</style>
