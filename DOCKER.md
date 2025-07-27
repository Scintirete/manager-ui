# Docker 部署指南

本项目支持 Docker 容器化部署，提供了完整的 Docker 配置和自动化构建流程。

## 快速开始

### 使用 Docker Hub 镜像

```bash
# 拉取最新镜像
docker pull scintirete/manager-ui:latest

# 运行容器
docker run -d \
  --name scintirete-manager-ui \
  -p 3000:3000 \
  scintirete/manager-ui:latest
```

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 本地构建

### 构建镜像

```bash
# 构建 Docker 镜像
docker build -t scintirete/manager-ui:local .

# 运行本地构建的镜像
docker run -d \
  --name scintirete-manager-ui-local \
  -p 3000:3000 \
  scintirete/manager-ui:local
```

## 环境配置

### 环境变量

可以通过环境变量配置应用：

```bash
docker run -d \
  --name scintirete-manager-ui \
  -p 3000:3000 \
  -e NUXT_PUBLIC_ENABLE_SERVER_PROXY=true \
  -e NUXT_PUBLIC_ENABLE_DB_DELETE=false \
  -e NUXT_PUBLIC_ENABLE_COLL_DELETE=false \
  scintirete/manager-ui:latest
```

### docker-compose.yaml 配置

```yaml
version: '3.8'

services:
  manager-ui:
    image: scintirete/manager-ui:latest
    container_name: scintirete-manager-ui
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NUXT_HOST=0.0.0.0
      - NUXT_PORT=3000
      - NUXT_PUBLIC_ENABLE_SERVER_PROXY=true
      - NUXT_PUBLIC_ENABLE_DB_DELETE=false
      - NUXT_PUBLIC_ENABLE_COLL_DELETE=false
    restart: unless-stopped
```

## 自动构建

### GitHub Actions

项目配置了自动化构建流程：

- **develop 分支**: 自动运行测试和构建
- **v* 标签**: 自动构建 Docker 镜像并推送到 Docker Hub，创建 GitHub Release

### 发布新版本

1. 确保代码已合并到 `main` 分支
2. 创建新的版本标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions 将自动：
   - 构建 Docker 镜像
   - 推送到 Docker Hub
   - 创建 GitHub Release

## 健康检查

容器包含健康检查配置：

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 网络配置

### 与 Scintirete 服务器连接

如果需要连接到其他容器中的 Scintirete 服务器：

```yaml
version: '3.8'

services:
  manager-ui:
    image: scintirete/manager-ui:latest
    ports:
      - "3000:3000"
    networks:
      - scintirete-network

  scintirete-server:
    image: scintirete/server:latest
    ports:
      - "8080:8080"
    networks:
      - scintirete-network

networks:
  scintirete-network:
    driver: bridge
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 更改端口映射
   docker run -d -p 8080:3000 scintirete/manager-ui:latest
   ```

2. **查看容器日志**
   ```bash
   docker logs scintirete-manager-ui
   ```

3. **进入容器调试**
   ```bash
   docker exec -it scintirete-manager-ui sh
   ```

### 性能优化

- 容器使用多阶段构建，优化镜像大小
- 生产环境只安装必要依赖
- 支持水平扩展

## 更多信息

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目 GitHub 仓库](https://github.com/scintirete/manager-ui) 