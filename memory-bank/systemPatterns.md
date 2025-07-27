# 系统架构模式

## 整体架构

```
用户界面 (Nuxt.js + 通用组件)
    ↓
配置层 (runtimeConfig)
    ↓
网络层 (axios + 服务器转发)
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

### 2. 网络请求模块 🆕
**重构优化**: 使用 axios 替代 fetch，提升稳定性和错误处理

**模式选择**:
- **客户端模式**: 使用 axios 直接请求 Scintirete API
- **服务器转发模式**: 通过 `/api/proxy` 使用 axios 转发请求

**实现模式**:
```typescript
// 统一的请求方法
async function apiRequest(endpoint: string, options: RequestOptions) {
  if (useServerProxy) {
    // 服务器转发：$fetch → proxy → axios
    return await $fetch('/api/proxy', {
      method: 'POST',
      body: { endpoint, ...options }
    })
  } else {
    // 客户端直连：直接使用 axios
    return await axios({
      url: `${baseUrl}${endpoint}`,
      ...options,
      timeout: 30000
    })
  }
}
```

### 3. 组件架构模块 🆕
**通用组件设计**:

```
通用组件层
├── ConnectionFormModal.vue     # 连接配置表单
├── VectorOperationModal.vue    # 向量操作表单
└── [未来扩展组件]

页面组件层
├── index.vue                   # 使用 ConnectionFormModal
├── database.vue               # 数据库列表展示
└── collection.vue             # 使用 VectorOperationModal
```

### 4. 页面层级结构
```
index.vue (连接配置页 + 模态框)
    ↓
/database/[id] (数据库管理页)
    ↓  
/database/[id]/collection/[name] (集合管理页 + 向量操作模态框)
```

## 数据流设计

### 连接配置流程
1. 用户点击按钮打开模态框
2. 填写连接信息并提交
3. 调用 `/health` 检查连通性
4. 成功后保存配置并跳转

### 向量操作流程
1. 用户选择操作类型（插入/搜索/删除）
2. 打开通用向量操作模态框
3. 根据操作类型显示对应表单字段
4. 提交后调用相应的 API
5. 显示操作结果

### 操作权限控制
- 基于 `runtimeConfig` 控制界面显示
- 删除操作需要二次确认
- 危险操作提供明确警告

## 错误处理模式 🆕

### 网络错误优化
- **连接超时**: axios 30秒超时 + 重试选项
- **连接拒绝**: 明确的中文错误提示
- **认证失败**: 自动返回连接配置页
- **服务不可用**: 显示服务状态和解决建议

### 数据错误  
- **参数验证**: 前端表单验证 + 后端验证
- **业务逻辑错误**: 显示具体错误信息
- **未知错误**: 提供错误报告功能

## 性能优化策略

### 页面加载
- 使用 Nuxt.js 的代码分割
- 组件懒加载和动态导入

### 组件复用 🆕
- 通用模态框组件减少重复代码
- 统一的表单验证和状态管理
- 可配置的组件适应不同场景

### 数据缓存
- 连接配置本地存储
- API 响应适当缓存
- 嵌入模型列表缓存

### 用户体验
- 加载状态指示
- 操作反馈和确认
- 统一的模态框交互模式

## 代码质量模式 🆕

### 组件设计原则
- **单一职责**: 每个组件专注特定功能
- **可复用性**: 通过 props 和 events 实现灵活配置
- **可维护性**: 清晰的接口定义和文档

### 类型安全
- 严格的 TypeScript 类型检查
- 组件 props 和 events 类型定义
- API 请求和响应类型安全

### 错误边界
- 组件级错误捕获
- 优雅的错误降级
- 用户友好的错误提示 