<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="isEditing ? '编辑连接' : '新建连接'"
    width="500px"
    @close="handleClose"
  >
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
            :disabled="!enableServerProxy"
          >
            服务器转发
            <span v-if="!enableServerProxy" style="color: #f56c6c; font-size: 12px;">
              （已禁用）
            </span>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleSubmit"
        :loading="submitting"
      >
        {{ isEditing ? '更新连接' : '添加连接' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { ConnectionConfig } from '~/composables/useApi'

interface Props {
  visible: boolean
  connection?: ConnectionConfig | null
  enableServerProxy?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: Omit<ConnectionConfig, 'id'>): void
  (e: 'update', id: string, data: Omit<ConnectionConfig, 'id'>): void
}

const props = withDefaults(defineProps<Props>(), {
  connection: null,
  enableServerProxy: true
})

const emit = defineEmits<Emits>()

// 表单引用和状态
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isEditing = computed(() => Boolean(props.connection?.id))

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
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (isEditing.value && props.connection?.id) {
      emit('update', props.connection.id, form.value)
    } else {
      emit('submit', form.value)
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

// 监听连接配置变化，初始化表单数据
watch(() => props.connection, (connection) => {
  if (connection) {
    form.value = {
      name: connection.name || '',
      server: connection.server,
      port: connection.port,
      password: connection.password,
      mode: connection.mode
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 暴露方法供父组件调用
defineExpose({
  setLoading: (value: boolean) => {
    submitting.value = value
  }
})
</script> 