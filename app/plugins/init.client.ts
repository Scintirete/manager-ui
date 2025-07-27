export default defineNuxtPlugin(() => {
  // 确保在客户端环境下初始化
  if (import.meta.client) {
    // 可以在这里进行客户端特定的初始化
    console.log('Scintirete Manager UI 客户端初始化')
  }
}) 