import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/scintirete.scss'
  ],
  modules: [ '@element-plus/nuxt' ],
  elementPlus: {
    themes: ['dark'],
    installMethods: ['ElLoading', 'ElMessage', 'ElMessageBox', 'ElNotification'],
    importStyle: 'scss',
    themeChalk: {
      $colors: {
        'primary': {
          'base': "#D97706",
        },
        'success': {
          'base': "#059669",
        },
        'warning': {
          'base': "#D97706",
        },
        'danger': {
          'base': "#DC2626",
        },
        'error': {
          'base': "#DC2626",
        },
        'info': {
          'base': "#2563EB",
        },
      },
    }
  },
  typescript: {
    typeCheck: false, // 禁用类型检查以避免 CI 中的问题
    tsConfig: {
      compilerOptions: {
        module: 'esnext',
        target: 'esnext',
        moduleResolution: 'node'
      }
    }
  },
  runtimeConfig: {
    public: {
      enableServerProxy: true,    // 服务器转发模式开关
      enableDbDelete: true,      // 数据库删除操作开关  
      enableCollDelete: true,     // 集合删除操作开关
      enableVectorDelete: true    // 向量删除操作开关
    }
  },
  vite: {
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url))
      }
    }
  }
})
