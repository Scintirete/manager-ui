# 系统架构模式

## 整体架构

```
用户界面 (Nuxt.js)
    ↓
配置层 (runtimeConfig)
    ↓
网络层 (客户端直连 / 服务器转发)
    ↓
Scintirete 向量数据库
```

## 核心组件设计

### 1. 配置管理模块
**位置**: `nuxt.config.ts` 中的 `runtimeConfig`

```typescript
runtimeConfig: {
  public: {
    enableServerProxy: true,    // 服务器转发模式开关
    enableDbDelete: false,      // 数据库删除操作开关  
    enableCollDelete: false     // 集合删除操作开关
  }
}
```

### 2. 网络请求模块
**模式选择**:
- **客户端模式**: 直接请求 Scintirete API
- **服务器转发模式**: 通过 `/api/proxy` 转发请求

**实现模式**:
```typescript
// 统一的请求方法
async function apiRequest(endpoint: string, options: RequestOptions) {
  if (useServerProxy) {
    return await $fetch('/api/proxy', {
      method: 'POST',
      body: { endpoint, ...options }
    })
  } else {
    return await $fetch(`${baseUrl}${endpoint}`, options)
  }
}
```

### 3. 页面层级结构
```
index.vue (连接配置页)
    ↓
/database/[id] (数据库管理页)
    ↓  
/database/[id]/collection/[name] (集合管理页)
```

## 数据流设计

### 连接配置流程
1. 用户配置连接信息
2. 调用 `/health` 检查连通性
3. 成功后保存配置并跳转

### 操作权限控制
- 基于 `runtimeConfig` 控制界面显示
- 删除操作需要二次确认
- 危险操作提供明确警告

## 错误处理模式

### 网络错误
- 连接超时：显示重试选项
- 认证失败：返回连接配置页
- 服务不可用：显示服务状态

### 数据错误  
- 参数验证：前端表单验证
- 业务逻辑错误：显示具体错误信息
- 未知错误：提供错误报告功能

## 性能优化策略

### 页面加载
- 使用 Nuxt.js 的代码分割
- 组件懒加载

### 数据缓存
- 连接配置本地存储
- API 响应适当缓存

### 用户体验
- 加载状态指示
- 操作反馈和确认 