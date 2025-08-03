<template>
  <NuxtLayout 
    name="default" 
    :current-connection="currentConnection"
    page-title="连接管理" 
  >
    <template #page-actions>
      <el-button 
        type="primary" 
        @click="showCreateModal"
        :icon="Plus"
      >
        新建连接
      </el-button>
    </template>

    <div class="connections-grid">
      <!-- 页面加载状态 -->
      <div v-if="connectionLoading" class="page-loading">
        <el-skeleton :rows="3" animated />
      </div>
      
      <!-- 连接卡片网格 -->
      <div v-else class="connections-container">
        <!-- 连接卡片 -->
        <div 
          v-for="connection in connections" 
          :key="connection.id"
          class="connection-card"
          @click="connectToDatabase(connection)"
        >
          <el-card shadow="hover" class="connection-item">
            <div class="connection-content">
              <div class="connection-header">
                <div class="connection-title">
                  <h3>{{ connection.name || `${connection.server}:${connection.port}` }}</h3>
                  <el-tag 
                    :type="connection.mode === 'proxy' ? 'warning' : 'success'" 
                    size="small"
                  >
                    {{ connection.mode === 'proxy' ? '代理模式' : '直连模式' }}
                  </el-tag>
                </div>
                <div class="connection-actions" @click.stop>
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="editConnection(connection)"
                    :icon="Edit"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="deleteConnection(connection.id)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              
              <div class="connection-details">
                <div class="detail-item">
                  <el-icon><Monitor /></el-icon>
                  <span>{{ connection.server }}:{{ connection.port }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Lock /></el-icon>
                  <span v-if="connection.password">需要密码验证</span>
                  <span v-else>无需密码验证</span>
                </div>
                <div class="detail-item">
                  <el-icon><Position /></el-icon>
                  <span>{{ connection.mode === 'proxy' ? '代理模式' : '直连模式' }}</span>
                </div>
              </div>

              <div class="connection-footer">
                <el-button 
                  type="primary" 
                  @click.stop="connectToDatabase(connection)"
                  :loading="connectingIds.includes(connection.id || '')"
                  style="width: 100%"
                >
                  {{ connectingIds.includes(connection.id || '') ? '连接中...' : '连接' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 空状态卡片 -->
        <div v-if="connections.length === 0" class="empty-state">
          <el-empty description="暂无连接配置">
            <el-button type="primary" @click="showCreateModal">
              创建第一个连接
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 快速开始面板 -->
      <div v-if="!connectionLoading" class="quick-start-panel">
        <el-card shadow="never" class="quick-start-card">
          <template #header>
            <div class="quick-start-header">
              <el-icon><QuestionFilled /></el-icon>
              <span>快速开始</span>
            </div>
          </template>
          
          <div class="quick-start-content">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>创建连接</h4>
                <p>配置 Scintirete 服务器的连接信息</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>管理数据库</h4>
                <p>创建和管理向量数据库</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>操作集合</h4>
                <p>在集合中插入、搜索和删除向量</p>
              </div>
            </div>
          </div>

          <div class="quick-start-actions">
            <el-button type="primary" @click="showCreateModal" style="width: 100%">
              开始使用
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 连接配置模态框 -->
    <ConnectionFormModal
      v-model:visible="modalVisible"
      :connection="currentConnection"
      :enable-server-proxy="config.public.enableServerProxy"
      @submit="handleSubmit"
      @update="handleUpdate"
      ref="modalRef"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Plus, Edit, Delete, Monitor, Lock, QuestionFilled, Position } from '@element-plus/icons-vue'
import type { ConnectionConfig } from '~/composables/useApi'

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI - 连接管理'
})

const config = useRuntimeConfig()
const router = useRouter()

// 连接管理
const { connections, connectionLoading, addConnection, updateConnection, removeConnection } = useConnections()
const { setConnection, validateConnection } = useApi()

// 组件状态
const modalVisible = ref(false)
const currentConnection = ref<ConnectionConfig | null>(null)
const connectingIds = ref<string[]>([])
const modalRef = ref()

// 显示创建/编辑模态框
const showCreateModal = () => {
  currentConnection.value = null
  modalVisible.value = true
}

const editConnection = (connection: ConnectionConfig) => {
  // 深拷贝连接配置以避免直接修改原始对象
  currentConnection.value = JSON.parse(JSON.stringify(connection))
  modalVisible.value = true
}

// 处理表单提交
const handleSubmit = async (connectionData: ConnectionConfig) => {
  try {
    modalRef.value?.setLoading(true)
    
    // 添加新连接
    addConnection(connectionData)
    ElMessage.success('连接配置已保存')
    
    modalVisible.value = false
  } catch (error: any) {
    console.error('Save connection failed:', error)
    ElMessage.error(`保存失败：${error.message || '未知错误'}`)
  } finally {
    modalRef.value?.setLoading(false)
  }
}

const handleUpdate = async (id: string, connectionData: ConnectionConfig) => {
  modalRef.value?.setLoading(true)
  try {
    // 更新现有连接
    const success = updateConnection(id, connectionData)
    modalVisible.value = false
    if (success) {
      ElMessage.success('连接配置已更新')
    } else {
      ElMessage.error('连接配置更新失败')
      return
    }
  } catch (error: any) {
    console.error('Update connection failed:', error)
    ElMessage.error(`更新失败：${error.message || '未知错误'}`)
  } finally {
    modalRef.value?.setLoading(false)
  }
}

// 连接到数据库
const connectToDatabase = async (connection: ConnectionConfig) => {
  const connectionId = connection.id
  if (!connectionId) return
  
  connectingIds.value.push(connectionId)
  
  try {
    // 设置当前连接
    setConnection(connection)
    
    // 验证连接健康状态和鉴权
    const validationResult = await validateConnection()
    
    if (validationResult.isHealthy && validationResult.isAuthenticated) {
      ElMessage.success('连接成功')
      // 跳转到数据库管理页面
      await router.push({
        path: '/database',
        query: { connection: connectionId }
      })
    } else {
      // 根据验证结果显示具体错误信息
      ElMessage.error(validationResult.error || '连接验证失败')
    }
  } catch (error: any) {
    console.error('Connection failed:', error)
    ElMessage.error(`连接失败：${error.message || '服务器无响应'}`)
  } finally {
    const index = connectingIds.value.indexOf(connectionId)
    if (index > -1) {
      connectingIds.value.splice(index, 1)
    }
  }
}

// 删除连接
const deleteConnection = async (connectionId: string | undefined) => {
  if (!connectionId) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个连接配置吗？',
      '确认删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    removeConnection(connectionId)
    ElMessage.success('连接配置已删除')
  } catch {
    // 用户取消删除
  }
}
</script>

<style scoped>
.connections-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--sc-space-lg);
  max-width: 1280px;
  margin: 0 auto;
}

.connections-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--sc-space-md);
}

.page-loading {
  grid-column: 1 / -1;
  padding: var(--sc-space-2xl) var(--sc-space-lg);
}

.connection-card {
  cursor: pointer;
  transition: all var(--sc-transition-fast);
  border-radius: var(--sc-radius-lg);
}

.connection-card:hover {
  transform: translateY(-2px);
}

.connection-item {
  height: 100%;
  border-radius: var(--sc-radius-lg);
  border: 1px solid var(--sc-border);
  overflow: hidden;
  background: var(--sc-bg-primary);
  box-shadow: var(--sc-shadow-sm);
  transition: all var(--sc-transition-normal);
}

.connection-item:hover {
  box-shadow: var(--sc-shadow-md);
  border-color: var(--sc-primary-start);
}

.connection-content {
  padding: var(--sc-space-lg);
}

.connection-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--sc-space-md);
}

.connection-title h3 {
  margin: 0 0 var(--sc-space-sm) 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--sc-text-primary);
  word-break: break-all;
  line-height: 1.3;
}

.connection-actions {
  display: flex;
  gap: var(--sc-space-sm);
  opacity: 0.7;
  transition: opacity var(--sc-transition-fast);
}

.connection-card:hover .connection-actions {
  opacity: 1;
}

.danger-button {
  color: var(--sc-error) !important;
}

.connection-details {
  margin-bottom: var(--sc-space-lg);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--sc-space-sm);
  margin-bottom: var(--sc-space-sm);
  color: var(--sc-text-secondary);
  font-size: 14px;
}

.detail-item .el-icon {
  color: var(--sc-text-tertiary);
}

.connection-footer {
  margin-top: auto;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.quick-start-panel {
  position: sticky;
  top: var(--sc-space-lg);
  height: fit-content;
}

.quick-start-card {
  border-radius: var(--sc-radius-lg);
  border: 1px solid var(--sc-border);
  background: var(--sc-bg-primary);
  box-shadow: var(--sc-shadow-sm);
}

.quick-start-header {
  display: flex;
  align-items: center;
  gap: var(--sc-space-sm);
  font-weight: 600;
  color: var(--sc-primary-start);
}

.quick-start-content {
  padding: 0;
}

.step-item {
  display: flex;
  gap: var(--sc-space-lg);
  padding: var(--sc-space-lg) 0;
  border-bottom: 1px solid var(--sc-border-light);
}

.step-item:last-child {
  border-bottom: none;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--sc-gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 var(--sc-space-xs) 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--sc-text-primary);
}

.step-content p {
  margin: 0;
  color: var(--sc-text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.quick-start-actions {
  padding-top: var(--sc-space-lg);
  border-top: 1px solid var(--sc-border-light);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .connections-grid {
    grid-template-columns: 1fr;
    gap: var(--sc-space-lg);
  }
  
  .quick-start-panel {
    position: static;
  }
  
  .connections-container {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .connections-container {
    grid-template-columns: 1fr;
  }
  
  .connection-header {
    flex-direction: column;
    gap: var(--sc-space-md);
  }
  
  .connection-actions {
    align-self: flex-end;
  }
  
  .connections-grid {
    gap: var(--sc-space-md);
  }
}

@media (max-width: 480px) {
  .connection-content {
    padding: var(--sc-space-md);
  }
  
  .step-item {
    gap: var(--sc-space-md);
  }
}
</style> 