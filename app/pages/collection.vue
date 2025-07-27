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
                  @click="showInsertDialog(row)"
                >
                  插入向量
                </el-button>
                <el-button 
                  type="success" 
                  size="small"
                  @click="showSearchDialog(row)"
                >
                  搜索向量
                </el-button>
                <el-button 
                  type="warning" 
                  size="small"
                  @click="showDeleteDialog(row)"
                >
                  删除向量
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 插入向量对话框 -->
        <el-dialog 
          v-model="insertDialogVisible" 
          title="插入向量" 
          width="600px"
          @close="resetInsertForm"
        >
          <el-form ref="insertFormRef" :model="insertForm" label-width="120px">
            <el-form-item label="嵌入模型">
              <el-select 
                v-model="insertForm.model" 
                placeholder="选择嵌入模型"
                style="width: 100%"
                :loading="modelsLoading"
              >
                <el-option 
                  v-for="model in embeddingModels"
                  :key="model.id"
                  :label="`${model.name} (${model.dimension}D)`"
                  :value="model.id"
                  :disabled="!model.available"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="文本内容">
              <el-input 
                v-model="insertForm.text"
                type="textarea" 
                :rows="4"
                placeholder="输入要转换为向量的文本内容"
              />
            </el-form-item>
            <el-form-item label="元数据 (JSON)">
              <el-input 
                v-model="insertForm.metadata"
                type="textarea" 
                :rows="3"
                placeholder='{"key": "value", "tag": "example"}'
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="insertDialogVisible = false">取消</el-button>
            <el-button 
              type="primary" 
              @click="handleInsert"
              :loading="inserting"
            >
              插入
            </el-button>
          </template>
        </el-dialog>

        <!-- 搜索向量对话框 -->
        <el-dialog 
          v-model="searchDialogVisible" 
          title="搜索向量" 
          width="800px"
          @close="resetSearchForm"
        >
          <el-form ref="searchFormRef" :model="searchForm" label-width="120px">
            <el-form-item label="嵌入模型">
              <el-select 
                v-model="searchForm.model" 
                placeholder="选择嵌入模型"
                style="width: 100%"
                :loading="modelsLoading"
              >
                <el-option 
                  v-for="model in embeddingModels"
                  :key="model.id"
                  :label="`${model.name} (${model.dimension}D)`"
                  :value="model.id"
                  :disabled="!model.available"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="查询文本">
              <el-input 
                v-model="searchForm.queryText"
                type="textarea" 
                :rows="3"
                placeholder="输入查询文本"
              />
            </el-form-item>
            <el-form-item label="返回数量">
              <el-input-number 
                v-model="searchForm.topK" 
                :min="1" 
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="过滤条件">
              <el-input 
                v-model="searchForm.filter"
                placeholder="可选，元数据过滤条件"
              />
            </el-form-item>
          </el-form>
          
          <!-- 搜索结果 -->
          <div v-if="searchResults.length > 0" class="search-results">
            <h4>搜索结果：</h4>
            <el-table :data="searchResults" size="small" max-height="300">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="distance" label="距离" width="100">
                <template #default="{ row }">
                  {{ row.distance.toFixed(4) }}
                </template>
              </el-table-column>
              <el-table-column prop="metadata" label="元数据">
                <template #default="{ row }">
                  <code>{{ JSON.stringify(row.metadata) }}</code>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <template #footer>
            <el-button @click="searchDialogVisible = false">关闭</el-button>
            <el-button 
              type="primary" 
              @click="handleSearch"
              :loading="searching"
            >
              搜索
            </el-button>
          </template>
        </el-dialog>

        <!-- 删除向量对话框 -->
        <el-dialog 
          v-model="deleteDialogVisible" 
          title="删除向量" 
          width="500px"
          @close="resetDeleteForm"
        >
          <el-form :model="deleteForm" label-width="120px">
            <el-form-item label="向量ID列表">
              <el-input 
                v-model="deleteForm.ids"
                type="textarea" 
                :rows="4"
                placeholder="输入要删除的向量ID，用逗号分隔，例如: 1,2,3"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="deleteDialogVisible = false">取消</el-button>
            <el-button 
              type="danger" 
              @click="handleDelete"
              :loading="deleting"
            >
              删除
            </el-button>
          </template>
        </el-dialog>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import type { CollectionInfo, EmbeddingModel, SearchResultItem, DistanceMetric } from '~/types/scintirete'

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
const inserting = ref(false)
const searching = ref(false)
const deleting = ref(false)

const collections = ref<CollectionInfo[]>([])
const embeddingModels = ref<EmbeddingModel[]>([])
const currentDatabase = ref('')
const currentCollection = ref<CollectionInfo | null>(null)

// 对话框状态
const insertDialogVisible = ref(false)
const searchDialogVisible = ref(false)
const deleteDialogVisible = ref(false)

// 表单数据
const insertForm = ref({
  model: '',
  text: '',
  metadata: ''
})

const searchForm = ref({
  model: '',
  queryText: '',
  topK: 10,
  filter: ''
})

const deleteForm = ref({
  ids: ''
})

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

// 显示插入对话框
const showInsertDialog = (collection: CollectionInfo) => {
  currentCollection.value = collection
  insertDialogVisible.value = true
}

// 显示搜索对话框
const showSearchDialog = (collection: CollectionInfo) => {
  currentCollection.value = collection
  searchDialogVisible.value = true
}

// 显示删除对话框
const showDeleteDialog = (collection: CollectionInfo) => {
  currentCollection.value = collection
  deleteDialogVisible.value = true
}

// 处理插入向量
const handleInsert = async () => {
  if (!currentCollection.value || !insertForm.value.text.trim()) {
    ElMessage.warning('请填写文本内容')
    return
  }

  inserting.value = true
  try {
    let metadata = {}
    if (insertForm.value.metadata.trim()) {
      try {
        metadata = JSON.parse(insertForm.value.metadata)
      } catch {
        ElMessage.error('元数据格式错误，请输入有效的JSON')
        return
      }
    }

    const response = await embedAndInsert(
      currentDatabase.value,
      currentCollection.value.name,
      [{ text: insertForm.value.text, metadata }],
      insertForm.value.model || undefined
    )

    ElMessage.success(`成功插入 ${response.inserted_count} 个向量`)
    insertDialogVisible.value = false
    resetInsertForm()
    await refreshCollections()
  } catch (error: any) {
    console.error('Insert failed:', error)
    ElMessage.error(`插入失败：${error.message || '未知错误'}`)
  } finally {
    inserting.value = false
  }
}

// 处理搜索向量
const handleSearch = async () => {
  if (!currentCollection.value || !searchForm.value.queryText.trim()) {
    ElMessage.warning('请填写查询文本')
    return
  }

  searching.value = true
  try {
    const response = await embedAndSearch(
      currentDatabase.value,
      currentCollection.value.name,
      searchForm.value.queryText,
      searchForm.value.topK,
      searchForm.value.model || undefined,
      searchForm.value.filter || undefined
    )

    searchResults.value = response.results || []
    ElMessage.success(`找到 ${searchResults.value.length} 个结果`)
  } catch (error: any) {
    console.error('Search failed:', error)
    ElMessage.error(`搜索失败：${error.message || '未知错误'}`)
  } finally {
    searching.value = false
  }
}

// 处理删除向量
const handleDelete = async () => {
  if (!currentCollection.value || !deleteForm.value.ids.trim()) {
    ElMessage.warning('请填写向量ID')
    return
  }

  try {
    const ids = deleteForm.value.ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
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

    deleting.value = true
    const response = await deleteVectors(
      currentDatabase.value,
      currentCollection.value.name,
      ids
    )

    ElMessage.success(`成功删除 ${response.deleted_count} 个向量`)
    deleteDialogVisible.value = false
    resetDeleteForm()
    await refreshCollections()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
      ElMessage.error(`删除失败：${error.message || '未知错误'}`)
    }
  } finally {
    deleting.value = false
  }
}

// 重置表单
const resetInsertForm = () => {
  insertForm.value = {
    model: '',
    text: '',
    metadata: ''
  }
}

const resetSearchForm = () => {
  searchForm.value = {
    model: '',
    queryText: '',
    topK: 10,
    filter: ''
  }
  searchResults.value = []
}

const resetDeleteForm = () => {
  deleteForm.value = {
    ids: ''
  }
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

.search-results {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.search-results h4 {
  margin-bottom: 10px;
  color: #303133;
}

code {
  background-color: #f5f7fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
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