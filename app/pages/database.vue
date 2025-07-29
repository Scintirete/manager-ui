<template>
  <NuxtLayout 
    name="default" 
    page-title="数据库管理"
    :current-connection="currentConnection"
  >
    <template #page-actions>
      <el-button type="default" @click="goBack" style="margin-right: 16px;">
        <el-icon><ArrowLeft /></el-icon>
        返回连接配置
      </el-button>
      <div v-if="currentConnection" style="margin-right: 16px; color: #606266;">
        连接: {{ currentConnection?.name || `${currentConnection?.server}:${currentConnection?.port}` }}
      </div>
      <el-button 
        type="success" 
        @click="showCreateDialog"
        :disabled="loading"
        style="margin-right: 10px"
      >
        创建数据库
      </el-button>
      <el-button 
        type="primary" 
        @click="refreshDatabases"
        :loading="loading"
        :icon="Refresh"
      >
        刷新
      </el-button>
    </template>

    <div class="database-content">
      <el-card shadow="hover">
        <template #header>
          <span>数据库列表</span>
        </template>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!databases.length" class="no-databases">
          <el-empty description="没有找到数据库">
            <el-button type="primary" @click="showCreateDialog">创建数据库</el-button>
          </el-empty>
        </div>
        
        <!-- 数据库列表 -->
        <el-table v-else :data="databases" stripe>
          <el-table-column prop="name" label="数据库名称" min-width="200">
            <template #default="{ row }">
              <strong>{{ row }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small"
                @click="manageCollections(row)"
              >
                管理集合
              </el-button>
              <el-button 
                v-if="config.public.enableDbDelete"
                type="danger" 
                size="small"
                @click="deleteDatabase(row)"
              >
                删除
              </el-button>
              <el-tooltip 
                v-else
                content="数据库删除操作已被管理员禁用"
                placement="top"
              >
                <el-button 
                  type="danger" 
                  size="small"
                  disabled
                >
                  删除
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
import type { ConnectionConfig } from '~/composables/useApi'

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI - 数据库管理'
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
    ElMessage.error('缺少连接参数')
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
    ElMessage.error(`加载数据库列表失败：${error.message || '未知错误'}`)
    
    // 如果是认证相关错误，返回连接页面
    if (error.status === 401 || error.status === 403) {
      await router.push('/')
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
  await router.push({
    path: `/collection`,
    query: {
      connection: connectionId,
      database: dbName
    }
  })
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
      ElMessage.success(`数据库 "${data.name}" 创建成功`)
      createDialogVisible.value = false
      await refreshDatabases()
    } else {
      ElMessage.error(response.message || '创建数据库失败')
    }
  } catch (error: any) {
    console.error('Create database failed:', error)
    ElMessage.error(`创建数据库失败：${error.message || '未知错误'}`)
  } finally {
    createDialogRef.value?.setLoading(false)
  }
}

// 删除数据库
const deleteDatabase = async (dbName: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据库 "${dbName}" 吗？此操作不可撤销！`,
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await dropDatabase(dbName)
    
    if (response.success) {
      ElMessage.success(`数据库 "${dbName}" 删除成功，共删除了 ${response.dropped_collections} 个集合`)
      await refreshDatabases()
    } else {
      ElMessage.error(response.message || '删除数据库失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete database failed:', error)
      ElMessage.error(`删除数据库失败：${error.message || '未知错误'}`)
    }
  }
}

// 返回连接配置页
const goBack = async () => {
  await router.push('/')
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