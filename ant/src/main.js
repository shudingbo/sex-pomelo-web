// with polyfills
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store/';
import { VueAxios } from './utils/request';
import { setStore, getStore, clearStore, clearAll } from './utils/storage';

import bootstrap from './core/bootstrap';
import './core/lazy_use';
import './permission'; // permission control
import './utils/filter'; // global filter
import filters from '@/filters/filter';
import './components/global.less';

Vue.config.productionTip = false;

// mount axios Vue.$http and this.$http
Vue.use(VueAxios);

Vue.prototype.axiosMsg = function (res) {
  let msg = res.message;
  if (typeof (msg) !== 'string') {
    if (typeof (msg.message) === 'string') {
      msg = msg.message;
    } else {
      msg = msg.toString();
    }
  }

  this.$message[res.status](msg);
};

Vue.prototype.getStore = getStore;
Vue.prototype.setStore = setStore;
Vue.prototype.clearStore = clearStore;
Vue.prototype.clearAll = clearAll;
Vue.prototype.getSexpContext = function () {
  let ret = getStore('sexp-cli:context');
  return (ret === null) ? 'all' : ret;
};

Vue.prototype.setSexpContext = function (context) {
  setStore('sexp-cli:context', context);
};

setStore('sexp-cli:context', 'all');

new Vue({
  router,
  store,
  created: bootstrap,
  render: h => h(App)
}).$mount('#app');

// 过滤器统一处理加载
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key]);
});

// eslint-disable-next-line no-extend-native
Date.prototype.Format = function (fmt) {
  // 兼容 moment 格式
  if (fmt === 'YYYY-MM-DD HH:mm:ss') fmt = 'yyyy-MM-dd hh:mm:ss';
  const o = {
    'M+': this.getMonth() + 1, // 月份
    'd+': this.getDate(), // 日
    'h+': this.getHours(), // 小时
    'm+': this.getMinutes(), // 分
    's+': this.getSeconds(), // 秒
    'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
    S: this.getMilliseconds() // 毫秒
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return fmt;
};
