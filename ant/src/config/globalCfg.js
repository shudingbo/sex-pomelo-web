import {
  ACCESS_TOKEN
} from '@/store/mutation-types';

export const globalCfg = {
  baseUrl: 'http://192.168.2.31:7050',
  accessToken: ACCESS_TOKEN,
  group: {
    startFrontendAfter: false, // 启动时，最后启动前端服务器
    stopFrontendAfter: true // 停止时，最后停止前端服务器
  }
};
