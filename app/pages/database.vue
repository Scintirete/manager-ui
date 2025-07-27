<template>
  <div class="database-page">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="connection-info">
            <el-button type="text" @click="goBack" style="color: white;">
              <el-icon><ArrowLeft /></el-icon>
              返回连接配置
            </el-button>
            <span class="connection-name">
              {{ currentConnection?.name || `${currentConnection?.server}:${currentConnection?.port}` }}
            </span>
          </div>
          <h1>数据库管理</h1>
        </div>
      </el-header>
      
      <el-main>
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>数据库列表</span>
              <el-button 
                type="primary" 
                @click="refreshDatabases"
                :loading="loading"
                :icon="Refresh"
              >
                刷新
              </el-button>
            </div>
          </template>
          
          <!-- 加载状态 -->
          <div v-if="loading && !databases.length" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          
          <!-- 空状态 -->
          <div v-else-if="!databases.length && !loading" class="no-databases">
            <el-empty description="没有找到数据库">
              <el-button type="primary" @click="refreshDatabases">重新加载</el-button>
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
      </el-main>
    </el-container>
  </div>
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
const { currentConnection, setConnection, listDatabases } = useApi()
const { getConnection } = useConnections()

// 页面状态
const loading = ref(false)
const databases = ref<string[]>([])

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
  await loadDatabases()
}

// 加载数据库列表
const loadDatabases = async () => {
  if (!currentConnection.value) return
  
  loading.value = true
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
  } finally {
    loading.value = false
  }
}

// 刷新数据库列表
const refreshDatabases = async () => {
  await loadDatabases()
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
    
    // TODO: 实现删除数据库的API调用
    ElMessage.warning('删除数据库功能待实现')
  } catch {
    // 用户取消删除
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
.database-page {
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

.connection-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.connection-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
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
  .el-main {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 1.5em;
  }
  
  .connection-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style> 