<template>
  <div class="user-wrapper">
    <div class="content-box">
      <notice-icon class="action"/>
      <sex-pomelo-batchrun ref="batchRun11" class="action"/>
      <a-dropdown>
        <span class="action ant-dropdown-link user-dropdown-menu">
          <a-avatar class="avatar" size="small" :src="avatar"/>
          <span>{{ nickname }}</span>
        </span>
        <a-menu slot="overlay" class="user-dropdown-menu-wrapper">
          <a-menu-item key="2" >
            <a href="javascript:;" @click="showSettingDrawer">
              <a-icon type="bg-colors"/>
              <span>主题设置</span>
            </a>
          </a-menu-item>
          <a-menu-divider/>
          <a-menu-item key="3">
            <a href="javascript:;" @click="handleLogout">
              <a-icon type="logout"/>
              <span>退出登录</span>
            </a>
          </a-menu-item>
        </a-menu>
      </a-dropdown>
    </div>
    <setting-drawer
      @click="settingDrawerVisible = !settingDrawerVisible"
      :settingDrawerVisible="settingDrawerVisible"
      v-model="settingDrawerVisible"
    ></setting-drawer>
  </div>
</template>

<script>
import NoticeIcon from '@/components/NoticeIcon';
import BatchRun from '@/components/tools/BatchRun';
import { mapActions, mapGetters } from 'vuex';
import SettingDrawer from '@/components/SettingDrawer';

export default {
  name: 'UserMenu',
  components: {
    NoticeIcon,
    'sex-pomelo-batchrun': BatchRun,
    SettingDrawer
  },
  data () {
    return {
      settingDrawerVisible: false
    };
  },
  computed: {
    ...mapGetters(['nickname', 'avatar'])

  },
  methods: {
    ...mapActions(['Logout']),
    handleLogout () {
      this.$confirm({
        title: '提示',
        content: '真的要注销登录吗 ?',
        onOk: () => {
          return this.Logout({}).then(() => {
            setTimeout(() => {
              window.location.reload();
            }, 16);
          }).catch(err => {
            this.$message.error({
              title: '错误',
              description: err.message
            });
          });
        },
        onCancel () {
        }
      });
    },
    showSettingDrawer () {
      this.settingDrawerVisible = true;
    }
  }
};
</script>
