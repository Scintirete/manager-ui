<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="isEditing ? $t('connectionForm.editConnection') : $t('connectionForm.newConnection')"
    width="500px"
    @close="handleClose"
  >
    <el-form 
      ref="formRef"
      :model="form" 
      :rules="rules" 
      label-width="140px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item :label="$t('connectionForm.name')" prop="name">
        <el-input 
          v-model="form.name" 
          :placeholder="$t('connectionForm.nameOptional')"
          clearable
        />
      </el-form-item>
      
      <el-form-item :label="$t('connectionForm.server')" prop="server">
        <el-input 
          v-model="form.server" 
          placeholder="127.0.0.1"
          clearable
        />
      </el-form-item>
      
      <el-form-item :label="$t('connectionForm.port')" prop="port">
        <el-input-number 
          v-model="form.port" 
          :min="1" 
          :max="65535"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item :label="$t('connectionForm.password')" prop="password">
        <el-input 
          v-model="form.password" 
          type="password"
          :placeholder="$t('connectionForm.passwordOptional')"
          show-password
          clearable
        />
      </el-form-item>
      
      <el-form-item :label="$t('connectionForm.mode')" prop="mode">
        <el-radio-group v-model="form.mode">
          <el-radio value="client">{{ $t('connectionForm.directConnect') }}</el-radio>
          <el-radio 
            value="proxy" 
            :disabled="!enableServerProxy"
          >
            {{ $t('connectionForm.serverProxy') }}
            <span v-if="!enableServerProxy" style="color: #f56c6c; font-size: 12px;">
              {{ $t('common.disabled') }}
            </span>
          </el-radio>
        </el-radio-group>
        <p class="help-text" v-if="form.mode === 'client'">
          {{ $t('connectionForm.directDescription') }}<br>
        </p>
        <p class="help-text" v-else>
          {{ $t('connectionForm.proxyDescription') }}
        </p>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">{{ $t('common.cancel') }}</el-button>
      <el-button 
        type="primary" 
        @click="handleSubmit"
        :loading="submitting"
      >
        {{ isEditing ? $t('common.update') : $t('common.add') }}
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

// 国际化
const { t: $t } = useI18n()

// 表单验证规则
const rules = computed((): FormRules => ({
  server: [
    { required: true, message: $t('connectionForm.serverRequired'), trigger: 'blur' }
  ],
  port: [
    { required: true, message: $t('connectionForm.portRequired'), trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: $t('connectionForm.portInvalid'), trigger: 'blur' }
  ],
  mode: [
    { required: true, message: $t('common.required'), trigger: 'change' }
  ]
}))

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

<style scoped>
.help-text {
  color: #999;
  font-size: 12px;
  margin-top: 10px;
}
</style>