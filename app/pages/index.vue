<template>
  <div class="connection-page">
    <el-container>
      <el-header>
        <h1>Scintirete Manager UI</h1>
        <p>高性能向量数据库管理工具</p>
      </el-header>
      
      <el-main>
        <!-- 操作按钮区域 -->
        <el-card class="action-card" shadow="hover">
          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="large"
              @click="showAddConnectionDialog"
              :icon="Plus"
            >
              新建连接
            </el-button>
            <el-button 
              type="default" 
              size="large"
              @click="refreshConnections"
              :icon="Refresh"
            >
              刷新列表
            </el-button>
          </div>
        </el-card>
        
        <!-- 连接列表 -->
        <el-card class="connection-list" shadow="hover">
          <template #header>
            <span>已保存的连接 ({{ connections.length }})</span>
          </template>
          
          <div v-if="connections.length === 0" class="no-connections">
            <el-empty description="暂无保存的连接配置">
              <el-button type="primary" @click="showAddConnectionDialog">创建第一个连接</el-button>
            </el-empty>
          </div>
          
          <el-table v-else :data="connections" stripe>
            <el-table-column prop="name" label="连接名称" min-width="150">
              <template #default="{ row }">
                <strong>{{ row.name || `${row.server}:${row.port}` }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="server" label="服务器" min-width="120" />
            <el-table-column prop="port" label="端口" width="80" />
            <el-table-column prop="mode" label="连接模式" width="120">
              <template #default="{ row }">
                <el-tag :type="row.mode === 'client' ? 'success' : 'info'">
                  {{ row.mode === 'client' ? '客户端直连' : '服务器转发' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small"
                  :loading="connectingId === row.id"
                  @click="testAndConnect(row)"
                >
                  {{ connectingId === row.id ? '连接中...' : '连接' }}
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="showEditConnectionDialog(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="deleteConnection(row.id!)"
                  style="color: #f56c6c;"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 连接配置模态框 -->
        <ConnectionFormModal
          v-model:visible="connectionDialogVisible"
          :connection="editingConnection"
          :enable-server-proxy="config.public.enableServerProxy"
          @submit="handleAddConnection"
          @update="handleUpdateConnection"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { ConnectionConfig } from '~/composables/useApi'

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI - 连接配置'
})

// 运行时配置
const config = useRuntimeConfig()

// 连接管理 - 确保在客户端初始化
const connectionsComposable = useConnections()
const apiComposable = useApi()

const { connections, addConnection, updateConnection, removeConnection } = connectionsComposable
const { setConnection, healthCheck } = apiComposable

// 页面状态
const connectingId = ref<string | null>(null)
const connectionDialogVisible = ref(false)
const editingConnection = ref<ConnectionConfig | null>(null)

// 显示新建连接对话框
const showAddConnectionDialog = () => {
  editingConnection.value = null
  connectionDialogVisible.value = true
}

// 显示编辑连接对话框
const showEditConnectionDialog = (connection: ConnectionConfig) => {
  editingConnection.value = connection
  connectionDialogVisible.value = true
}

// 刷新连接列表
const refreshConnections = () => {
  // 连接数据存储在 localStorage，这里只是提供一个刷新按钮的交互
  ElMessage.success('连接列表已刷新')
}

// 处理新建连接
const handleAddConnection = (data: Omit<ConnectionConfig, 'id'>) => {
  addConnection(data)
  ElMessage.success('连接配置已保存')
}

// 处理更新连接
const handleUpdateConnection = (id: string, data: Omit<ConnectionConfig, 'id'>) => {
  if (updateConnection(id, data)) {
    ElMessage.success('连接配置已更新')
  } else {
    ElMessage.error('更新失败')
  }
}

// 删除连接
const deleteConnection = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个连接配置吗？',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (removeConnection(id)) {
      ElMessage.success('连接配置已删除')
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
    // 用户取消删除
  }
}

// 测试连接并跳转
const testAndConnect = async (connection: ConnectionConfig) => {
  connectingId.value = connection.id!
  
  try {
    // 设置当前连接
    setConnection(connection)
    
    // 测试连接
    const isHealthy = await healthCheck()
    
    if (isHealthy) {
      ElMessage.success('连接成功！正在跳转到数据库管理页面...')
      // 跳转到数据库管理页
      await navigateTo(`/database?connection=${connection.id}`)
    } else {
      ElMessage.error('连接失败，请检查服务器地址和端口')
    }
  } catch (error: any) {
    console.error('Connection test failed:', error)
    ElMessage.error(`连接失败：${error.message || '未知错误'}`)
  } finally {
    connectingId.value = null
  }
}
</script>

<style scoped>
.connection-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.el-header {
  background-color: #409eff;
  color: white;
  text-align: center;
  padding: 20px 0;
}

.el-header h1 {
  margin: 0;
  font-size: 2em;
}

.el-header p {
  margin: 10px 0 0 0;
  opacity: 0.9;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.action-card {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 10px 0;
}

.connection-list {
  /* 样式已在全局定义 */
}

.no-connections {
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
  
  .el-header h1 {
    font-size: 1.5em;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-buttons .el-button {
    width: 200px;
  }
}
</style> 