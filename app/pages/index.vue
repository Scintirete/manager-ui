<template>
  <div class="connection-page">
    <el-container>
      <el-header>
        <h1>Scintirete Manager UI</h1>
        <p>高性能向量数据库管理工具</p>
      </el-header>
      
      <el-main>
        <!-- 连接表单 -->
        <el-card class="connection-form" shadow="hover">
          <template #header>
            <span>{{ isEditing ? '编辑连接' : '新建连接' }}</span>
            <el-button 
              v-if="isEditing" 
              type="text" 
              @click="cancelEdit"
              style="float: right; margin-left: 10px;"
            >
              取消
            </el-button>
          </template>
          
          <el-form 
            ref="formRef"
            :model="form" 
            :rules="rules" 
            label-width="120px"
            @submit.prevent="handleSubmit"
          >
            <el-form-item label="连接名称" prop="name">
              <el-input 
                v-model="form.name" 
                placeholder="可选，用于识别连接"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="服务器地址" prop="server">
              <el-input 
                v-model="form.server" 
                placeholder="127.0.0.1"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="HTTP端口" prop="port">
              <el-input-number 
                v-model="form.port" 
                :min="1" 
                :max="65535"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="form.password" 
                type="password"
                placeholder="留空表示无密码"
                show-password
                clearable
              />
            </el-form-item>
            
            <el-form-item label="连接模式" prop="mode">
              <el-radio-group v-model="form.mode">
                <el-radio value="client">客户端直连</el-radio>
                <el-radio 
                  value="proxy" 
                  :disabled="!config.public.enableServerProxy"
                >
                  服务器转发
                  <span v-if="!config.public.enableServerProxy" style="color: #f56c6c; font-size: 12px;">
                    （已禁用）
                  </span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleSubmit"
                :loading="submitting"
              >
                {{ isEditing ? '更新连接' : '添加连接' }}
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 连接列表 -->
        <el-card class="connection-list" shadow="hover">
          <template #header>
            <span>已保存的连接 ({{ connections.length }})</span>
          </template>
          
          <div v-if="connections.length === 0" class="no-connections">
            <el-empty description="暂无保存的连接配置">
              <el-button type="primary" @click="resetForm">创建第一个连接</el-button>
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
                  @click="editConnection(row)"
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
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
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

// 表单引用和状态
const formRef = ref<FormInstance>()
const submitting = ref(false)
const connectingId = ref<string | null>(null)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

// 表单数据
const form = ref<Omit<ConnectionConfig, 'id'>>({
  name: '',
  server: '127.0.0.1',
  port: 8080,
  password: '',
  mode: 'client'
})

// 表单验证规则
const rules: FormRules = {
  server: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号范围：1-65535', trigger: 'blur' }
  ],
  mode: [
    { required: true, message: '请选择连接模式', trigger: 'change' }
  ]
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    server: '127.0.0.1',
    port: 8080,
    password: '',
    mode: 'client'
  }
  formRef.value?.clearValidate()
  isEditing.value = false
  editingId.value = null
}

// 取消编辑
const cancelEdit = () => {
  resetForm()
}

// 编辑连接
const editConnection = (connection: ConnectionConfig) => {
  form.value = {
    name: connection.name || '',
    server: connection.server,
    port: connection.port,
    password: connection.password,
    mode: connection.mode
  }
  isEditing.value = true
  editingId.value = connection.id!
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEditing.value && editingId.value) {
      // 更新连接
      if (updateConnection(editingId.value, form.value)) {
        ElMessage.success('连接配置已更新')
        resetForm()
      } else {
        ElMessage.error('更新失败')
      }
    } else {
      // 添加新连接
      addConnection(form.value)
      ElMessage.success('连接配置已保存')
      resetForm()
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    submitting.value = false
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

.connection-form {
  margin-bottom: 20px;
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

.el-form-item {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .el-main {
    padding: 10px;
  }
  
  .el-header h1 {
    font-size: 1.5em;
  }
}
</style> 