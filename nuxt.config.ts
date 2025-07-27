// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [ '@element-plus/nuxt' ],
  elementPlus: {
    themes: ['dark'],
    defaultDarkTheme: 'dark',
    installMethods: ['ElLoading', 'ElMessage', 'ElMessageBox', 'ElNotification']
  }
})
