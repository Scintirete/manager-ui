// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [ '@element-plus/nuxt' ],
  elementPlus: {
    themes: ['dark'],
    installMethods: ['ElLoading', 'ElMessage', 'ElMessageBox', 'ElNotification']
  },
  runtimeConfig: {
    public: {
      enableServerProxy: true,    // 服务器转发模式开关
      enableDbDelete: false,      // 数据库删除操作开关  
      enableCollDelete: false     // 集合删除操作开关
    }
  }
})
