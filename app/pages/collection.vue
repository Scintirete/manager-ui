<template>
  <div class="collection-page">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="breadcrumb">
            <el-button type="text" @click="goBack" style="color: white;">
              <el-icon><ArrowLeft /></el-icon>
              返回数据库列表
            </el-button>
            <span class="separator">/</span>
            <span class="current-db">{{ currentDatabase }}</span>
          </div>
          <h1>集合管理</h1>
        </div>
      </el-header>
      
      <el-main>
        <!-- 集合列表 -->
        <el-card class="collections-card" shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>集合列表</span>
              <el-button 
                type="primary" 
                @click="refreshCollections"
                :loading="loading"
                :icon="Refresh"
              >
                刷新
              </el-button>
            </div>
          </template>
          
          <!-- 加载状态 -->
          <div v-if="loading && !collections.length" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          
          <!-- 空状态 -->
          <div v-else-if="!collections.length && !loading" class="no-collections">
            <el-empty description="没有找到集合">
              <el-button type="primary" @click="refreshCollections">重新加载</el-button>
            </el-empty>
          </div>
          
          <!-- 集合表格 -->
          <el-table v-else :data="collections" stripe>
            <el-table-column prop="name" label="集合名称" min-width="150" />
            <el-table-column prop="dimension" label="维度" width="80" />
            <el-table-column prop="vector_count" label="向量数量" width="100">
              <template #default="{ row }">
                {{ row.vector_count.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="deleted_count" label="已删除" width="80">
              <template #default="{ row }">
                {{ row.deleted_count.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="memory_bytes" label="内存占用" width="100">
              <template #default="{ row }">
                {{ formatBytes(row.memory_bytes) }}
              </template>
            </el-table-column>
            <el-table-column prop="metric_type" label="距离度量" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ getMetricTypeName(row.metric_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="showVectorDialog('insert', row)"
                >
                  插入向量
                </el-button>
                <el-button 
                  type="success" 
                  size="small"
                  @click="showVectorDialog('search', row)"
                >
                  搜索向量
                </el-button>
                <el-button 
                  type="warning" 
                  size="small"
                  @click="showVectorDialog('delete', row)"
                >
                  删除向量
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 向量操作模态框 -->
        <VectorOperationModal
          v-model:visible="vectorDialogVisible"
          :operation="currentOperation"
          :embedding-models="embeddingModels"
          :models-loading="modelsLoading"
          :search-results="searchResults"
          @submit="handleVectorOperation"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import type { CollectionInfo, EmbeddingModel, SearchResultItem, DistanceMetric } from '../../types/scintirete'

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI - 集合管理'
})

// 获取路由参数
const route = useRoute()
const router = useRouter()

// API 管理
const { 
  currentConnection, 
  setConnection, 
  listCollections, 
  listEmbeddingModels,
  embedAndInsert,
  embedAndSearch,
  deleteVectors
} = useApi()
const { getConnection } = useConnections()

// 页面状态
const loading = ref(false)
const modelsLoading = ref(false)

const collections = ref<CollectionInfo[]>([])
const embeddingModels = ref<EmbeddingModel[]>([])
const currentDatabase = ref('')
const currentCollection = ref<CollectionInfo | null>(null)

// 对话框状态
const vectorDialogVisible = ref(false)
const currentOperation = ref<'insert' | 'search' | 'delete'>('insert')
const searchResults = ref<SearchResultItem[]>([])

// 初始化连接和数据
const initializePage = async () => {
  const connectionId = route.query.connection as string
  const dbName = route.query.database as string
  
  if (!connectionId || !dbName) {
    ElMessage.error('缺少必要参数')
    await router.push('/')
    return
  }

  const connection = getConnection(connectionId)
  if (!connection) {
    ElMessage.error('连接配置不存在')
    await router.push('/')
    return
  }

  setConnection(connection)
  currentDatabase.value = dbName
  
  await Promise.all([
    loadCollections(),
    loadEmbeddingModels()
  ])
}

// 加载集合列表
const loadCollections = async () => {
  loading.value = true
  try {
    const response = await listCollections(currentDatabase.value)
    collections.value = response.collections || []
  } catch (error: any) {
    console.error('Failed to load collections:', error)
    ElMessage.error(`加载集合列表失败：${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 加载嵌入模型列表
const loadEmbeddingModels = async () => {
  modelsLoading.value = true
  try {
    const response = await listEmbeddingModels()
    embeddingModels.value = response.models || []
  } catch (error: any) {
    console.error('Failed to load embedding models:', error)
    ElMessage.error(`加载嵌入模型列表失败：${error.message || '未知错误'}`)
  } finally {
    modelsLoading.value = false
  }
}

// 刷新集合列表
const refreshCollections = async () => {
  await loadCollections()
}

// 显示向量操作对话框
const showVectorDialog = (operation: 'insert' | 'search' | 'delete', collection: CollectionInfo) => {
  currentOperation.value = operation
  currentCollection.value = collection
  searchResults.value = [] // 重置搜索结果
  vectorDialogVisible.value = true
}

// 处理向量操作
const handleVectorOperation = async (formData: any) => {
  if (!currentCollection.value) return

  try {
    switch (currentOperation.value) {
      case 'insert':
        await handleInsert(formData)
        break
      case 'search':
        await handleSearch(formData)
        break
      case 'delete':
        await handleDelete(formData)
        break
    }
  } catch (error: any) {
    console.error(`${currentOperation.value} operation failed:`, error)
    ElMessage.error(`操作失败：${error.message || '未知错误'}`)
  }
}

// 处理插入向量
const handleInsert = async (formData: any) => {
  if (!formData.text.trim()) {
    ElMessage.warning('请填写文本内容')
    return
  }

  let metadata = {}
  if (formData.metadata.trim()) {
    try {
      metadata = JSON.parse(formData.metadata)
    } catch {
      ElMessage.error('元数据格式错误，请输入有效的JSON')
      return
    }
  }

  const response = await embedAndInsert(
    currentDatabase.value,
    currentCollection.value!.name,
    [{ text: formData.text, metadata }],
    formData.model || undefined
  )

  ElMessage.success(`成功插入 ${response.inserted_count} 个向量`)
  vectorDialogVisible.value = false
  await refreshCollections()
}

// 处理搜索向量
const handleSearch = async (formData: any) => {
  if (!formData.queryText.trim()) {
    ElMessage.warning('请填写查询文本')
    return
  }

  const response = await embedAndSearch(
    currentDatabase.value,
    currentCollection.value!.name,
    formData.queryText,
    formData.topK,
    formData.model || undefined,
    formData.filter || undefined
  )

  searchResults.value = response.results || []
  ElMessage.success(`找到 ${searchResults.value.length} 个结果`)
}

// 处理删除向量
const handleDelete = async (formData: any) => {
  if (!formData.ids.trim()) {
    ElMessage.warning('请填写向量ID')
    return
  }

  const ids = formData.ids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id))
  if (ids.length === 0) {
    ElMessage.error('请输入有效的向量ID')
    return
  }

  await ElMessageBox.confirm(
    `确定要删除 ${ids.length} 个向量吗？此操作不可撤销！`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )

  const response = await deleteVectors(
    currentDatabase.value,
    currentCollection.value!.name,
    ids
  )

  ElMessage.success(`成功删除 ${response.deleted_count} 个向量`)
  vectorDialogVisible.value = false
  await refreshCollections()
}

// 工具函数
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getMetricTypeName = (type: DistanceMetric): string => {
  const names: Record<DistanceMetric, string> = {
    [0]: 'Unknown',
    [1]: 'L2',
    [2]: 'Cosine',
    [3]: 'Inner Product'
  }
  return names[type] || 'Unknown'
}

// 返回数据库列表
const goBack = async () => {
  const connectionId = route.query.connection
  await router.push({
    path: '/database',
    query: { connection: connectionId }
  })
}

// 页面挂载时初始化
onMounted(async () => {
  await initializePage()
})
</script>

<style scoped>
.collection-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.el-header {
  background-color: #409eff;
  color: white;
  padding: 20px 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.separator {
  color: rgba(255, 255, 255, 0.7);
}

.current-db {
  font-weight: bold;
}

.header-content h1 {
  margin: 0;
  font-size: 1.8em;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.collections-card {
  margin-bottom: 20px;
}

.loading-container {
  padding: 20px 0;
}

.no-collections {
  text-align: center;
  padding: 40px 0;
}

@media (max-width: 768px) {
  .el-main {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 1.5em;
  }
  
  .breadcrumb {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style> 