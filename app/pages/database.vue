<template>
  <NuxtLayout 
    name="default" 
    :page-title="$t('database.title')"
    :current-connection="currentConnection"
  >
    <template #page-actions>
      <el-button type="default" @click="goBack" style="margin-right: 16px;">
        <el-icon><ArrowLeft /></el-icon>
        {{ $t('database.backToConnections') }}
      </el-button>
      <div v-if="currentConnection" style="margin-right: 16px; color: #606266;">
        {{ $t('database.connection') }}: {{ currentConnection?.name || `${currentConnection?.server}:${currentConnection?.port}` }}
      </div>
      <el-button 
        type="success" 
        @click="showCreateDialog"
        :disabled="loading"
        style="margin-right: 10px"
      >
        {{ $t('database.createDatabase') }}
      </el-button>
      <el-button 
        type="primary" 
        @click="refreshDatabases"
        :loading="loading"
        :icon="Refresh"
      >
        {{ $t('database.refresh') }}
      </el-button>
    </template>

    <div class="database-content">
      <el-card shadow="hover">
        <template #header>
          <span>{{ $t('database.list') }}</span>
        </template>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!databases.length" class="no-databases">
          <el-empty :description="$t('database.noDatabases')">
            <el-button type="primary" @click="showCreateDialog">{{ $t('database.createDatabase') }}</el-button>
          </el-empty>
        </div>
        
        <!-- 数据库列表 -->
        <el-table v-else :data="databases" stripe>
          <el-table-column prop="name" :label="$t('database.name')" min-width="200">
            <template #default="{ row }">
              <strong>{{ row }}</strong>
            </template>
          </el-table-column>
          <el-table-column :label="$t('database.operations')" width="200">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small"
                @click="manageCollections(row)"
              >
                {{ $t('database.manageCollections') }}
              </el-button>
              <el-button 
                v-if="config.public.enableDbDelete"
                type="danger" 
                size="small"
                @click="deleteDatabase(row)"
              >
                {{ $t('database.delete') }}
              </el-button>
              <el-tooltip 
                v-else
                :content="$t('database.deleteDisabled')"
                placement="top"
              >
                <el-button 
                  type="danger" 
                  size="small"
                  disabled
                >
                  {{ $t('database.delete') }}
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 创建数据库模态框 -->
      <DatabaseFormModal
        v-model:visible="createDialogVisible"
        @submit="handleCreateDatabase"
        ref="createDialogRef"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'

// 国际化
const { t: $t } = useI18n()
const $localePath = useLocalePath()

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI - ' + $t('database.title')
})

// 获取路由参数
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// API 和连接管理
const { currentConnection, setConnection, listDatabases, createDatabase, dropDatabase } = useApi()
const { getConnection } = useConnections()

// 页面状态
const loading = ref(false)
const databases = ref<string[]>([])
const createDialogVisible = ref(false)
const createDialogRef = ref()

// 初始化连接
const initializeConnection = async () => {
  const connectionId = route.query.connection as string
  if (!connectionId) {
    ElMessage.error($t('common.missingParams'))
    await router.push($localePath('/'))
    return
  }

  const connection = getConnection(connectionId)
  if (!connection) {
    ElMessage.error($t('common.connectionNotFound'))
    await router.push($localePath('/'))
    return
  }

  setConnection(connection)
  
  // 设置页面loading状态
  loading.value = true
  try {
    await loadDatabases()
  } finally {
    loading.value = false
  }
}

// 加载数据库列表
const loadDatabases = async () => {
  if (!currentConnection.value) return
  
  try {
    const response = await listDatabases()
    databases.value = response.names || []
  } catch (error: any) {
    console.error('Failed to load databases:', error)
    ElMessage.error(`${$t('database.loadFailed')}：${error.message || $t('common.unknown')}`)
    
    // 如果是认证相关错误，返回连接页面
    if (error.status === 401 || error.status === 403) {
      await router.push($localePath('/'))
    }
  }
}

// 刷新数据库列表
const refreshDatabases = async () => {
  loading.value = true
  try {
    await loadDatabases()
  } finally {
    loading.value = false
  }
}

// 管理集合
const manageCollections = async (dbName: string) => {
  const connectionId = route.query.connection
  await router.push($localePath({
    path: `/collection`,
    query: {
      connection: connectionId,
      database: dbName
    }
  }))
}

// 显示创建数据库对话框
const showCreateDialog = () => {
  createDialogVisible.value = true
}

// 处理创建数据库
const handleCreateDatabase = async (data: { name: string }) => {
  try {
    createDialogRef.value?.setLoading(true)
    const response = await createDatabase(data.name)
    
    if (response.success) {
      ElMessage.success($t('databaseForm.created', { name: data.name }))
      createDialogVisible.value = false
      await refreshDatabases()
    } else {
      ElMessage.error(response.message || $t('databaseForm.createFailed'))
    }
  } catch (error: any) {
    console.error('Create database failed:', error)
    ElMessage.error(`${$t('databaseForm.createFailed')}：${error.message || $t('common.unknown')}`)
  } finally {
    createDialogRef.value?.setLoading(false)
  }
}

// 删除数据库
const deleteDatabase = async (dbName: string) => {
  try {
    await ElMessageBox.confirm(
      $t('database.deleteConfirm', { name: dbName }),
      $t('database.dangerousOperation'),
      {
        confirmButtonText: $t('database.confirmDelete'),
        cancelButtonText: $t('database.cancel'),
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await dropDatabase(dbName)
    
    if (response.success) {
      ElMessage.success($t('database.deleted', { name: dbName, count: response.dropped_collections }))
      await refreshDatabases()
    } else {
      ElMessage.error(response.message || $t('database.deleteFailed'))
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete database failed:', error)
      ElMessage.error(`${$t('database.deleteFailed')}：${error.message || $t('common.unknown')}`)
    }
  }
}

// 返回连接配置页
const goBack = async () => {
  await router.push($localePath('/'))
}

// 页面挂载时初始化
onMounted(async () => {
  await initializeConnection()
})
</script>

<style scoped>
.database-content {
  padding: 0 24px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container {
  padding: 20px 0;
}

.no-databases {
  text-align: center;
  padding: 40px 0;
}

.el-table {
  margin-top: 0;
}

@media (max-width: 768px) {
  .database-content {
    padding: 0 16px 16px;
  }
}
</style> 