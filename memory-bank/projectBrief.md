## 项目名称

Scintirete Manager UI - 高性能向量数据库管理工具

## 项目目标

基础的登录连接、database/collections/vector 管理和召回测试的工具，以及还有简单的 RAG Bot，基于 nuxtjs 开发，通过 http 做交互

需要支持两种模式：纯客户端模式（用来连接本地网络的服务），服务器转发模式（用来连接内网服务）

## 技术栈

- 前端框架：Nuxt.js 4.0
- UI 框架：Element Plus
- 语言：TypeScript
- 包管理：pnpm

数据结构请用自动生成的 types/scintirete.d.ts

## 核心需求

核心配置（使用 `nuxt.config.js` 中的 `runtimeConfig`）：

- 服务器转发模式默认开启，禁用后无法使用服务器转发模式
- 数据库删除操作默认禁用，禁用后隐藏界面中的删除数据库操作
- 集合删除操作默认禁用，禁用后隐藏界面中的删除集合操作

服务器转发逻辑：

- 编写一个 POST /proxy 接口，把必要的请求信息传递给后端，后端使用 axios 进行服务调用
- 客户端模式就直接发起请求即可

核心页面（数据库和 collections）：

- 连接配置页（作为首页和入口）

  - 创建或编辑表单：服务器、HTTP端口、密码、连接模式单选（客户端或使用服务器转发，在配置中禁用时，服务器转发 disabled 并提示已禁用）

    - 服务器默认为 127.0.0.1
    - HTTP 端口默认为 8080
    - 密码默认为空
    - 连接模式默认客户端
  - 列表页：展示服务器、端口、连接模式，操作

    - 操作：连接、删除
    - 点击连接后，调用 /health 检查联通性，成功的话进入数据库管理页
  - 存储：所有配置放到 localstorage 中
- 数据库管理页

  - 列表展示 GET /databases 返回的数据库名称、信息和操作

    - 操作：管理 collections ，点击后进入集合管理页面
- 集合管理页面

  - 列表展示 GET /databases/:db_name/collections 中的信息以及操作

    - 操作：通过文本插入向量（POST /databases/:db_name/collections/:coll_name/embed）、通过文本搜索向量（/databases/:db_name/collections/:coll_name/embed/search）、删除向量（DELETE /databases/:db_name/collections/:coll_name/vectors）
    - 通过文本插入和搜索向量时都需要选择模型，模型列表可从 /embed/models 获取

gin 路由声明

```
// Package http provides route setup for the HTTP server.
package http

// setupRoutes sets up all HTTP routes
func (h *Server) setupRoutes() {
	api := h.engine.Group("/api/v1")

	// Database operations
	api.POST("/databases", h.handleCreateDatabase)
	api.DELETE("/databases/:db_name", h.handleDropDatabase)
	api.GET("/databases", h.handleListDatabases)

	// Collection operations
	api.POST("/databases/:db_name/collections", h.handleCreateCollection)
	api.DELETE("/databases/:db_name/collections/:coll_name", h.handleDropCollection)
	api.GET("/databases/:db_name/collections/:coll_name", h.handleGetCollectionInfo)
	api.GET("/databases/:db_name/collections", h.handleListCollections)

	// Vector operations
	api.POST("/databases/:db_name/collections/:coll_name/vectors", h.handleInsertVectors)
	api.DELETE("/databases/:db_name/collections/:coll_name/vectors", h.handleDeleteVectors)
	api.POST("/databases/:db_name/collections/:coll_name/search", h.handleSearch)

	// Text embedding operations
	api.POST("/databases/:db_name/collections/:coll_name/embed", h.handleEmbedAndInsert)
	api.POST("/databases/:db_name/collections/:coll_name/embed/search", h.handleEmbedAndSearch)
	api.POST("/embed", h.handleEmbedText)
	api.GET("/embed/models", h.handleListEmbeddingModels)

	// Health check
	api.GET("/health", h.handleHealth)
}
```