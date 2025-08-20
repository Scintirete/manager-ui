<template>
  <NuxtLayout 
    name="default" 
    :page-title="$t('collection.title')"
    :current-connection="currentConnection"
    :current-database="currentDatabase"
  >
    <template #page-actions>
      <el-button type="default" @click="goBack" style="margin-right: 16px;">
        <el-icon><ArrowLeft /></el-icon>
        {{ $t('collection.backToDatabases') }}
      </el-button>
      <div v-if="currentDatabase" style="margin-right: 16px; color: #606266;">
        {{ $t('collection.database') }}: {{ currentDatabase }}
      </div>
      <el-button 
        type="success" 
        @click="showCreateCollectionDialog"
        :disabled="loading"
        style="margin-right: 10px"
      >
        {{ $t('collection.createCollection') }}
      </el-button>
      <el-button 
        type="primary" 
        @click="refreshCollections"
        :loading="loading"
        :icon="Refresh"
      >
        {{ $t('collection.refresh') }}
      </el-button>
    </template>

    <div class="collection-content">
      <!-- 集合列表 -->
      <el-card class="collections-card" shadow="hover">
        <template #header>
          <span>{{ $t('collection.list') }}</span>
        </template>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!collections.length" class="no-collections">
          <el-empty :description="$t('collection.noCollections')">
            <el-button type="primary" @click="showCreateCollectionDialog">{{ $t('collection.createCollection') }}</el-button>
          </el-empty>
        </div>
        
        <!-- 集合表格 -->
        <el-table v-else :data="collections" stripe>
          <el-table-column prop="name" :label="$t('collection.name')" min-width="100" />
          <el-table-column prop="dimension" :label="$t('collection.dimension')" width="80" />
          <el-table-column prop="vector_count" :label="$t('collection.vectorCount')" width="100">
            <template #default="{ row }">
              {{ row.vector_count.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="deleted_count" :label="$t('collection.deletedCount')" width="80">
            <template #default="{ row }">
              {{ row.deleted_count.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="memory_bytes" :label="$t('collection.memoryUsage')" width="100">
            <template #default="{ row }">
              {{ formatBytes(row.memory_bytes) }}
            </template>
          </el-table-column>
          <el-table-column prop="metric_type" :label="$t('collection.metricType')" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getMetricTypeName(row.metric_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('collection.operations')" width="450">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small"
                @click="showVectorDialog('insert', row)"
              >
                {{ $t('collection.insertVector') }}
              </el-button>
              <el-button 
                type="success" 
                size="small"
                @click="showVectorDialog('search', row)"
              >
                {{ $t('collection.searchVector') }}
              </el-button>
              <el-button 
                v-if="config.public.enableVectorDelete"
                type="danger" 
                size="small"
                @click="showVectorDialog('delete', row)"
              >
                {{ $t('collection.deleteVector') }}
              </el-button>
              <el-tooltip 
                v-else
                :content="$t('collection.vectorDeleteDisabled')"
                placement="top"
              >
                <el-button 
                  type="warning" 
                  size="small"
                  disabled
                >
                  {{ $t('collection.deleteVector') }}
                </el-button>
              </el-tooltip>
              <el-button 
                v-if="config.public.enableCollDelete"
                type="danger" 
                size="small"
                @click="deleteCollection(row)"
              >
                {{ $t('collection.deleteCollection') }}
              </el-button>
              <el-tooltip 
                v-else
                :content="$t('collection.collectionDeleteDisabled')"
                placement="top"
              >
                <el-button 
                  type="danger" 
                  size="small"
                  disabled
                >
                  {{ $t('collection.deleteCollection') }}
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
import type { CollectionInfo, EmbeddingModel, SearchResultItem, DistanceMetric, HnswConfig } from '~/types/scintirete.d.ts'

// 国际化
const { t: $t } = useI18n()

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
  insertVectors,
  searchVectors,
  deleteVectors
} = useApi()
const { getConnection } = useConnections()

// 页面状态
const loading = ref(false)
const modelsLoading = ref(false)
const operationLoading = ref(false)

// 解析向量数组的辅助函数
const parseVectorArray = (input: string): number[][] => {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error($t('messages.vectorArrayEmpty'))
  }

  try {
    // 如果是单个向量数组格式：[1, 2, 3]
    if (trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.includes('],[')) {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed) && parsed.every(n => typeof n === 'number')) {
        return [parsed]
      }
    }
    
    // 如果是多个向量数组格式：[[1,2],[3,4]] 或者 每行一个向量
    if (trimmed.includes('\n')) {
      // 每行一个向量的格式
      const lines = trimmed.split('\n').filter(line => line.trim())
      return lines.map(line => {
        const parsed = JSON.parse(line.trim())
        if (!Array.isArray(parsed) || !parsed.every(n => typeof n === 'number')) {
          throw new Error($t('messages.vectorArrayMustBeNumbers'))
        }
        return parsed
      })
    } else {
      // JSON数组格式：[[1,2],[3,4]]
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        // 检查是否为二维数组
        if (parsed.every(arr => Array.isArray(arr) && arr.every(n => typeof n === 'number'))) {
          return parsed
        }
        // 检查是否为一维数组
        if (parsed.every(n => typeof n === 'number')) {
          return [parsed]
        }
      }
    }
    
    throw new Error($t('messages.unsupportedVectorFormat'))
  } catch (error: any) {
    if (error.message.includes($t('messages.unsupportedVectorFormat')) || error.message.includes($t('messages.vectorArrayMustBeNumbers'))) {
      throw error
    }
    throw new Error($t('messages.jsonFormatError'))
  }
}

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
    ElMessage.error($t('messages.missingRequiredParams'))
    await router.push('/')
    return
  }

  const connection = getConnection(connectionId)
  if (!connection) {
    ElMessage.error($t('messages.connectionNotFound'))
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
    ElMessage.error(`${$t('messages.loadCollectionsFailed')}：${error.message || $t('messages.unknownError')}`)
  }
}

// 加载嵌入模型列表
const loadEmbeddingModels = async () => {
  try {
    const response = await listEmbeddingModels()
    embeddingModels.value = response.models || []
  } catch (error: any) {
    console.error('Failed to load embedding models:', error)
    ElMessage.error(`${$t('messages.loadModelsFailed')}：${error.message || $t('messages.unknownError')}`)
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
      ElMessage.success($t('messages.collectionCreated', { name: data.name }))
      createCollectionDialogVisible.value = false
      await refreshCollections()
    } else {
      ElMessage.error(response.message || $t('messages.createCollectionFailed'))
    }
  } catch (error: any) {
    console.error('Create collection failed:', error)
    ElMessage.error(`${$t('messages.createCollectionFailed')}：${error.message || $t('messages.unknownError')}`)
  } finally {
    createCollectionDialogRef.value?.setLoading(false)
  }
}

// 删除集合
const deleteCollection = async (collection: CollectionInfo) => {
  try {
    await ElMessageBox.confirm(
      $t('messages.deleteCollectionConfirm', { name: collection.name }),
      $t('messages.dangerousOperation'),
      {
        confirmButtonText: $t('messages.confirmDelete'),
        cancelButtonText: $t('messages.cancel'),
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await dropCollection(currentDatabase.value, collection.name)
    
    if (response.success) {
      ElMessage.success($t('messages.collectionDeleted', { name: collection.name, count: response.dropped_vectors }))
      await refreshCollections()
    } else {
      ElMessage.error(response.message || $t('messages.deleteCollectionFailed'))
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete collection failed:', error)
      ElMessage.error(`${$t('messages.deleteCollectionFailed')}：${error.message || $t('messages.unknownError')}`)
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

  const operationName = currentOperation.value === 'insert' ? $t('messages.insert') : 
                       currentOperation.value === 'search' ? $t('messages.search') : $t('messages.delete')
  
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
  let metadata = {}
  if (formData.metadata.trim()) {
    try {
      metadata = JSON.parse(formData.metadata)
    } catch {
      ElMessage.error($t('messages.metadataFormatError'))
      return
    }
  }

  let response
  
  if (formData.insertType === 'array') {
    // 数组插入模式
    if (!formData.vectorArray.trim()) {
      ElMessage.warning($t('messages.fillVectorArray'))
      return
    }

    try {
      // 解析向量数组
      const vectorData = parseVectorArray(formData.vectorArray)
      const vectors = vectorData.map(elements => ({ elements, metadata }))
      
      response = await insertVectors(
        currentDatabase.value,
        currentCollection.value!.name,
        vectors
      )
    } catch (error: any) {
      ElMessage.error(`${$t('messages.vectorArrayFormatError')}：${error.message}`)
      return
    }
  } else {
    // 嵌入插入模式
    if (!formData.text.trim()) {
      ElMessage.warning($t('messages.fillTextContent'))
      return
    }

    response = await embedAndInsert(
      currentDatabase.value,
      currentCollection.value!.name,
      [{ text: formData.text, metadata }],
      formData.model || undefined
    )
  }

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
  let response
  
  if (formData.searchType === 'vector') {
    // 向量搜索模式
    if (!formData.queryVector.trim()) {
      ElMessage.warning($t('messages.fillQueryVector'))
      return
    }

    try {
      // 解析查询向量
      const queryVector = parseVectorArray(formData.queryVector)[0]
      if (!queryVector || queryVector.length === 0) {
        throw new Error($t('messages.vectorArrayEmpty'))
      }
      
      response = await searchVectors(
        currentDatabase.value,
        currentCollection.value!.name,
        queryVector,
        formData.topK,
        formData.filter || undefined
      )
    } catch (error: any) {
      ElMessage.error(`${$t('vector.vectorFormatError')}：${error.message}`)
      return
    }
  } else {
    // 文本搜索模式
    if (!formData.queryText.trim()) {
      ElMessage.warning($t('messages.fillQueryText'))
      return
    }

    response = await embedAndSearch(
      currentDatabase.value,
      currentCollection.value!.name,
      formData.queryText,
      formData.topK,
      formData.model || undefined,
      formData.filter || undefined
    )
  }

  searchResults.value = response.results || []
  ElMessage.success($t('messages.foundResults', { count: searchResults.value.length }))
}

// 处理删除向量
const handleDelete = async (formData: any) => {
  if (!formData.ids.trim()) {
    ElMessage.warning($t('messages.fillVectorIds'))
    return
  }

  const ids = formData.ids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id))
  if (ids.length === 0) {
    ElMessage.error($t('vector.invalidIds'))
    return
  }

  await ElMessageBox.confirm(
    $t('messages.deleteVectorConfirm', { count: ids.length }),
    $t('messages.confirmDelete'),
    {
      confirmButtonText: $t('messages.confirmDelete'),
      cancelButtonText: $t('messages.cancel'),
      type: 'warning'
    }
  )

  const response = await deleteVectors(
    currentDatabase.value,
    currentCollection.value!.name,
    ids
  )

  ElMessage.success($t('messages.vectorDeleted', { count: response.deleted_count }))
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