# 当前工作上下文

## 项目状态
🚀 **全面功能增强完成** - 项目已实现现代化 PC 版面设计和完整的数据库管理功能

## 当前焦点
项目已完成重大功能增强，包括 CI/CD 流程、完整的数据库集合管理和现代化 UI 设计：

### 已完成
- ✅ 项目基础结构搭建（Nuxt.js + Element Plus）
- ✅ Memory Bank 文档体系建立
- ✅ 技术栈确认和依赖安装
- ✅ 核心配置和权限控制系统
- ✅ 服务器转发 API 实现
- ✅ 连接配置页面（项目入口）
- ✅ 数据库管理界面
- ✅ 集合管理界面
- ✅ 向量操作功能（插入、搜索、删除）
- ✅ 完整的用户交互和错误处理
- ✅ **网络请求层重构**：将 fetch 改为 axios
- ✅ **组件架构优化**：创建通用组件提升复用性
- ✅ **UI 统一优化**：表单操作统一使用模态框

### 最新完成（本次全面增强）
1. **CI/CD 和部署系统**
   - GitHub Actions 自动构建和发布流程
   - develop 分支自动构建，v* tag 自动发布
   - Docker 容器化支持和 docker-compose 配置
   - 自动推送到 scintirete/manager-ui 仓库

2. **数据库和集合管理功能**
   - 实现创建数据库 API 和 UI 界面
   - 实现创建集合 API 和 UI 界面
   - 集合创建包含完整 HNSW 参数配置
   - 距离度量选择（L2、Cosine、Inner Product）

3. **现代化 PC 版面设计**
   - 全新的布局系统 (layouts/default.vue)
   - 现代化的卡片式连接管理界面
   - 响应式设计支持多种屏幕尺寸
   - 侧边导航和面包屑导航系统
   - 快速开始引导面板

4. **组件系统优化**
   - 通用页面容器组件 (PageContainer.vue)
   - 数据库创建表单组件 (DatabaseFormModal.vue)
   - 集合创建表单组件 (CollectionFormModal.vue)
   - 统一的加载状态和空状态处理

5. **API 鉴权系统重构** 🆕
   - 统一鉴权处理：创建 `buildAuthHeaders()` 统一生成 Authorization 头
   - 自动鉴权注入：`apiRequest` 方法自动为所有接口（除 health）添加鉴权
   - 增强连接验证：新增 `validateConnection()` 同时检查健康状态和鉴权
   - 技术问题修复：支持动态导入和组件方法暴露
   - 优化错误处理：提供更详细的鉴权失败信息

### 进行中
暂无

### 最新完成（Release工作流优化）
1. **简化Release工作流**
   - 移除前端应用打包（tar.gz/zip）
   - 移除复杂的Release资产创建
   - 保留Docker镜像构建和GitHub Release创建
   - 修复镜像名称大小写问题：硬编码为 `scintirete/manager-ui`

### 最新完成（权限控制和Release修正）🆕
1. **Release工作流修正**
   - 修正Docker镜像latest标签推送问题：移除`enable={{is_default_branch}}`条件
   - 现在所有release版本都会自动推送latest标签到GitHub Container Registry

2. **服务器转发模式控制修正**
   - 修正属性传递问题：统一使用`enable-server-proxy`属性名
   - 确保`NUXT_PUBLIC_ENABLE_SERVER_PROXY=false`时正确禁用服务器转发模式选项
   
3. **向量删除权限控制**
   - 新增`enableVectorDelete`配置项控制向量删除功能
   - 在集合管理页面中根据配置显示/隐藏删除向量按钮
   - 被禁用时显示禁用提示信息

### 下一步计划
1. 实现 RAG Bot 功能
2. 添加高级向量操作
3. 性能优化和用户体验改进
4. 添加更多管理功能

## 技术决策

### 已确定
- **前端框架**: Nuxt.js 4.0（SSR/SPA 混合模式）
- **UI 组件**: Element Plus（已配置暗色主题）
- **类型系统**: 使用自动生成的 `types/scintirete.d.ts`
- **网络请求**: 
  - 客户端直连模式：使用 axios
  - 服务器转发模式：Nuxt $fetch + axios
- **组件架构**: 模态框统一表单操作，提升用户体验

### 新增技术改进
- **axios 集成**: 改善网络请求的稳定性和错误处理
- **组件复用**: 通用模态框组件减少代码重复
- **一致性设计**: 统一的表单交互模式

## 关键注意事项
- 所有删除操作默认禁用，需要配置开启
- 服务器转发模式可在配置中禁用
- 网络请求已优化超时和错误处理机制
- 组件设计支持灵活的表单验证和交互 