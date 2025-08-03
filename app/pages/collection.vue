<template>
  <NuxtLayout 
    name="default" 
    page-title="集合管理"
    :current-connection="currentConnection"
    :current-database="currentDatabase"
  >
    <template #page-actions>
      <el-button type="default" @click="goBack" style="margin-right: 16px;">
        <el-icon><ArrowLeft /></el-icon>
        返回数据库列表
      </el-button>
      <div v-if="currentDatabase" style="margin-right: 16px; color: #606266;">
        数据库: {{ currentDatabase }}
      </div>
      <el-button 
        type="success" 
        @click="showCreateCollectionDialog"
        :disabled="loading"
        style="margin-right: 10px"
      >
        创建集合
      </el-button>
      <el-button 
        type="primary" 
        @click="refreshCollections"
        :loading="loading"
        :icon="Refresh"
      >
        刷新
      </el-button>
    </template>

    <div class="collection-content">
      <!-- 集合列表 -->
      <el-card class="collections-card" shadow="hover">
        <template #header>
          <span>集合列表</span>
        </template>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!collections.length" class="no-collections">
          <el-empty description="没有找到集合">
            <el-button type="primary" @click="showCreateCollectionDialog">创建集合</el-button>
          </el-empty>
        </div>
        
        <!-- 集合表格 -->
        <el-table v-else :data="collections" stripe>
          <el-table-column prop="name" label="集合名称" min-width="100" />
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
          <el-table-column label="操作" width="450">
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
                v-if="config.public.enableVectorDelete"
                type="danger" 
                size="small"
                @click="showVectorDialog('delete', row)"
              >
                删除向量
              </el-button>
              <el-tooltip 
                v-else
                content="向量删除操作已被管理员禁用"
                placement="top"
              >
                <el-button 
                  type="warning" 
                  size="small"
                  disabled
                >
                  删除向量
                </el-button>
              </el-tooltip>
              <el-button 
                v-if="config.public.enableCollDelete"
                type="danger" 
                size="small"
                @click="deleteCollection(row)"
              >
                删除集合
              </el-button>
              <el-tooltip 
                v-else
                content="集合删除操作已被管理员禁用"
                placement="top"
              >
                <el-button 
                  type="danger" 
                  size="small"
                  disabled
                >
                  删除集合
                </el-button>
              </el-tooltip>
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
        :operation-loading="operationLoading"
        @submit="handleVectorOperation"
      />

      <!-- 插入结果模态框 -->
      <InsertResultModal
        v-model:visible="insertResultDialogVisible"
        :result="insertResult"
      />

      <!-- 创建集合模态框 -->
      <CollectionFormModal
        v-model:visible="createCollectionDialogVisible"
        @submit="handleCreateCollection"
        ref="createCollectionDialogRef"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import type { CollectionInfo, EmbeddingModel, SearchResultItem, DistanceMetric, HnswConfig } from '~/types/scintirete'

// 获取路由参数
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// API 管理
const { 
  currentConnection, 
  setConnection, 
  listCollections, 
  createCollection,
  dropCollection,
  listEmbeddingModels,
  embedAndInsert,
  embedAndSearch,
  deleteVectors
} = useApi()
const { getConnection } = useConnections()

// 页面状态
const loading = ref(false)
const modelsLoading = ref(false)
const operationLoading = ref(false)

const collections = ref<CollectionInfo[]>([])
const embeddingModels = ref<EmbeddingModel[]>([])
const currentDatabase = ref('')
const currentCollection = ref<CollectionInfo | null>(null)

// 对话框状态
const vectorDialogVisible = ref(false)
const currentOperation = ref<'insert' | 'search' | 'delete'>('insert')
const searchResults = ref<SearchResultItem[]>([])
const createCollectionDialogVisible = ref(false)
const createCollectionDialogRef = ref()
const insertResultDialogVisible = ref(false)
const insertResult = ref<{ inserted_ids: string[]; inserted_count: number } | null>(null)

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
  
  // 设置页面loading状态
  loading.value = true
  modelsLoading.value = true
  
  try {
    await Promise.all([
      loadCollections(),
      loadEmbeddingModels()
    ])
  } finally {
    loading.value = false
    modelsLoading.value = false
  }
}

// 加载集合列表
const loadCollections = async () => {
  try {
    const response = await listCollections(currentDatabase.value)
    collections.value = response.collections || []
  } catch (error: any) {
    console.error('Failed to load collections:', error)
    ElMessage.error(`加载集合列表失败：${error.message || '未知错误'}`)
  }
}

// 加载嵌入模型列表
const loadEmbeddingModels = async () => {
  try {
    const response = await listEmbeddingModels()
    embeddingModels.value = response.models || []
  } catch (error: any) {
    console.error('Failed to load embedding models:', error)
    ElMessage.error(`加载嵌入模型列表失败：${error.message || '未知错误'}`)
  }
}

// 刷新集合列表
const refreshCollections = async () => {
  loading.value = true
  try {
    await loadCollections()
  } finally {
    loading.value = false
  }
}

// 显示创建集合对话框
const showCreateCollectionDialog = () => {
  createCollectionDialogVisible.value = true
}

// 处理创建集合
const handleCreateCollection = async (data: { 
  name: string 
  metricType: DistanceMetric
  hnswConfig: HnswConfig
}) => {
  try {
    createCollectionDialogRef.value?.setLoading(true)
    const response = await createCollection(
      currentDatabase.value,
      data.name,
      data.metricType,
      data.hnswConfig
    )
    
    if (response.success) {
      ElMessage.success(`集合 "${data.name}" 创建成功`)
      createCollectionDialogVisible.value = false
      await refreshCollections()
    } else {
      ElMessage.error(response.message || '创建集合失败')
    }
  } catch (error: any) {
    console.error('Create collection failed:', error)
    ElMessage.error(`创建集合失败：${error.message || '未知错误'}`)
  } finally {
    createCollectionDialogRef.value?.setLoading(false)
  }
}

// 删除集合
const deleteCollection = async (collection: CollectionInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除集合 "${collection.name}" 吗？此操作不可撤销！`,
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await dropCollection(currentDatabase.value, collection.name)
    
    if (response.success) {
      ElMessage.success(`集合 "${collection.name}" 删除成功，共删除了 ${response.dropped_vectors} 个向量`)
      await refreshCollections()
    } else {
      ElMessage.error(response.message || '删除集合失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete collection failed:', error)
      ElMessage.error(`删除集合失败：${error.message || '未知错误'}`)
    }
  }
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

  const operationName = currentOperation.value === 'insert' ? '插入' : 
                       currentOperation.value === 'search' ? '搜索' : '删除'
  
  operationLoading.value = true
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
    ElMessage.error(`${operationName}操作失败：${error.message || '未知错误'}`)
  } finally {
    operationLoading.value = false
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

  // 设置插入结果并显示弹窗
  insertResult.value = {
    inserted_ids: response.inserted_ids.map((id: any) => String(id)),
    inserted_count: response.inserted_count
  }
  insertResultDialogVisible.value = true
  
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
const formatBytes = (bytes_str: string): string => {
  const bytes = parseInt(bytes_str)
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
.collection-content {
  padding: 0 24px 24px;
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
  .collection-content {
    padding: 0 16px 16px;
  }
}
</style> 