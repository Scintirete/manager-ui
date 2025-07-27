# Scintirete Manager UI

高性能向量数据库管理工具 - 基于 Nuxt.js 4.0 开发

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问应用
打开浏览器访问 http://localhost:3000
```

## ✨ 功能特性

### 🔗 连接管理
- **双模式支持**: 客户端直连 & 服务器转发
- **连接配置**: 服务器地址、端口、密码、连接模式
- **本地存储**: 安全保存连接配置到 localStorage
- **健康检查**: 自动测试连接可用性

### 🗄️ 数据库管理
- **数据库列表**: 查看所有可用数据库
- **权限控制**: 可配置的删除操作保护
- **集合导航**: 快速进入集合管理

### 📊 集合操作
- **集合信息**: 维度、向量数量、内存占用、距离度量
- **向量插入**: 文本转向量并插入，支持元数据
- **向量搜索**: 语义搜索，支持相似度排序
- **向量删除**: 批量删除指定ID的向量
- **模型选择**: 动态加载可用的嵌入模型

### 🎨 用户体验
- **响应式设计**: 支持桌面端和移动端
- **暗色主题**: Element Plus 暗色主题
- **中文界面**: 完整的中文本地化
- **错误处理**: 完善的错误提示和重试机制

## 🛠️ 技术架构

### 前端技术栈
- **框架**: Nuxt.js 4.0 (Vue 3.5)
- **UI库**: Element Plus 2.10
- **语言**: TypeScript
- **包管理**: pnpm

### 核心特性
- **服务器端渲染**: Nuxt.js SSR/SPA 混合模式
- **类型安全**: 自动生成的 API 类型定义
- **状态管理**: Vue Composition API
- **网络层**: 统一的请求封装，支持代理转发

## 📁 项目结构

```
manager-ui/
├── app.vue                 # 应用入口
├── nuxt.config.ts         # Nuxt 配置
├── pages/                 # 页面组件
│   ├── index.vue         # 连接配置页（首页）
│   ├── database.vue      # 数据库管理页
│   └── collection.vue    # 集合管理页
├── composables/          # Vue 组合式函数
│   ├── useApi.ts        # API 请求封装
│   └── useConnections.ts # 连接配置管理
├── server/api/           # 服务器 API
│   └── proxy.post.ts    # 代理转发接口
├── types/               # 类型定义
│   └── scintirete.d.ts # 自动生成的 API 类型
└── memory-bank/         # 项目文档系统
    ├── projectBrief.md
    ├── activeContext.md
    ├── systemPatterns.md
    └── progress.md
```

## ⚙️ 配置选项

在 `nuxt.config.ts` 中配置功能开关：

```typescript
runtimeConfig: {
  public: {
    enableServerProxy: true,    // 服务器转发模式开关
    enableDbDelete: false,      // 数据库删除操作开关  
    enableCollDelete: false     // 集合删除操作开关
  }
}
```

## 🔄 网络模式

### 客户端直连模式
- 直接连接到 Scintirete 服务器
- 适用于本地网络环境
- 性能更优，延迟更低

### 服务器转发模式
- 通过 `/api/proxy` 转发请求
- 适用于内网或受限网络环境
- 支持跨域和网络隔离场景

## 📚 API 文档

项目支持完整的 Scintirete API：

- **数据库操作**: 创建、删除、列表
- **集合操作**: 创建、删除、信息查询
- **向量操作**: 插入、删除、搜索
- **文本嵌入**: 文本转向量、模型管理
- **健康检查**: 服务可用性检测

## 🧪 测试

```bash
# 运行基础测试
pnpm test

# 查看测试指南
cat TESTING.md
```

详细的功能测试检查表参见 [TESTING.md](./TESTING.md)

## 🚀 部署

### 开发环境
```bash
pnpm dev
```

### 生产环境
```bash
# 构建
pnpm build

# 预览
pnpm preview
```

## 📋 系统要求

- **Node.js**: >= 16.x
- **pnpm**: >= 8.x
- **浏览器**: 现代浏览器，支持 ES6+

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 📖 文档

- [项目简介](./memory-bank/projectBrief.md)
- [技术背景](./memory-bank/techContext.md)
- [系统架构](./memory-bank/systemPatterns.md)
- [开发进度](./memory-bank/progress.md)
- [测试指南](./TESTING.md)

## 📄 许可证

[MIT License](./LICENSE)

---

**Scintirete Manager UI** - 让向量数据库管理变得简单高效！ 🎯
