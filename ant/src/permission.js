import Vue from 'vue';
import router from './router';
import store from './store';

import notification from 'ant-design-vue/es/notification';
import { setDocumentTitle, domTitle } from '@/utils/domUtil';
import { ACCESS_TOKEN } from '@/store/mutation-types';

const whiteList = ['login', 'register', 'registerResult']; // no redirect whitelist
const defaultRoutePath = '/dashboard/workplace';

router.beforeEach((to, from, next) => {
  to.meta && (typeof to.meta.title !== 'undefined' && setDocumentTitle(`${to.meta.title} - ${domTitle}`));
  if (Vue.ls.get(ACCESS_TOKEN)) {
    /* has token */
    if (to.path === '/user/login') {
      next({ path: defaultRoutePath });
    } else {
      if (store.getters.roles.length === 0) {
        (async () => {
          try {
            await store.dispatch('GetMasters');
            // Get PomeloInfo
            await store.dispatch('GetSystemInfo');
            await store.dispatch('GetNodeInfo');
            await store.dispatch('GetServers');

            // GetInfo
            let res = await store.dispatch('GetInfo');
            const roles = res.result && res.result.role;
            await store.dispatch('GenerateRoutes', { roles });

            // 根据roles权限生成可访问的路由表
            // 动态添加可访问路由表
            router.addRoutes(store.getters.addRouters);
            const redirect = decodeURIComponent(from.query.redirect || to.path);
            if (to.path === redirect) {
              // hack方法 确保addRoutes已完成 ,set the replace: true so the navigation will not leave a history record
              next({ ...to, replace: true });
            } else {
              // 跳转到目的路由
              next({ path: redirect });
            }
          } catch (err) {
            console.log(err);
            notification.error({
              message: '错误',
              description: '请求用户信息失败，请重试'
            });
            store.dispatch('Logout').then(() => {
              next({ path: '/user/login', query: { redirect: to.fullPath } });
            });
          }
        })();
      } else {
        next();
      }
    }
  } else {
    if (whiteList.includes(to.name)) {
      // 在免登录白名单，直接进入
      next();
    } else {
      next({ path: '/user/login', query: { redirect: to.fullPath } });
    }
  }
});

router.afterEach(() => {

});
