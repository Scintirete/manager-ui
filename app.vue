<template>
  <div>
    <el-config-provider :locale="zhCn">
      <NuxtPage />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 确保页面标题
useHead({
  title: 'Scintirete Manager UI',
  meta: [
    { name: 'description', content: '高性能向量数据库管理工具' }
  ]
})
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#__nuxt {
  min-height: 100vh;
}
</style> 