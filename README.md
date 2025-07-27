# Scintirete Manager UI

高性能向量数据库 Scintirete 的现代化管理工具

## 技术栈

- **前端框架**: Nuxt.js 4.0 + Vue 3
- **UI 组件库**: Element Plus
- **开发语言**: TypeScript
- **包管理器**: pnpm

## 特性

- 🚀 现代化 Web 界面
- 📱 响应式设计
- 🔧 完整的数据库管理功能
- 📊 向量数据可视化
- 🔍 智能搜索功能
- 📝 自动生成的 TypeScript 类型支持

## 开发设置

### 安装依赖
```bash
pnpm install
```

### 生成类型声明
```bash
pnpm run gen-types
```

### 启动开发服务器
```bash
pnpm run dev
```

### 构建生产版本
```bash
pnpm run build
```

## 类型生成

项目包含自动化的 TypeScript 类型生成工具：

1. **proto 文件位置**: `schemas/scintirete.proto`
2. **生成脚本**: `scripts/generate-types.ts`
3. **输出文件**: `types/scintirete.d.ts`

每当修改 proto 文件后，运行 `pnpm run gen-types` 重新生成类型声明。

### 使用生成的类型

```typescript
import type { 
  DistanceMetric, 
  Vector, 
  SearchRequest, 
  ScintireteServiceClient 
} from '../types/scintirete'

// 使用枚举
const metric: DistanceMetric = DistanceMetric.COSINE

// 使用接口
const vector: Vector = {
  elements: [0.1, 0.2, 0.3],
  metadata: { label: 'example' }
}

// 类型安全的服务调用
const searchRequest: SearchRequest = {
  auth: { password: 'secret' },
  db_name: 'my_db',
  collection_name: 'vectors',
  query_vector: [0.1, 0.2, 0.3],
  top_k: 10
}
```

## 项目结构

```
manager-ui/
├── schemas/               # Proto 文件定义
├── scripts/               # 构建和工具脚本
├── types/                 # 生成的类型声明
├── app/                   # Nuxt.js 应用代码
├── memory-bank/           # 项目文档
└── public/               # 静态资源
```

## License

MIT
