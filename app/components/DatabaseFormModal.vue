<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建数据库"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="数据库名" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入数据库名称"
          :disabled="loading"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          创建
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: { name: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: ''
})

const rules = computed((): FormRules => ({
  name: [
    { required: true, message: $t('databaseForm.nameRequired'), trigger: 'blur' },
    { min: 1, max: 50, message: $t('collectionForm.nameLength'), trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: $t('databaseForm.nameInvalid'), trigger: 'blur' }
  ]
}))

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleClose = () => {
  form.name = ''
  formRef.value?.clearValidate()
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', { name: form.name })
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

// 当对话框打开时重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    form.name = ''
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
})

// 暴露 loading 状态供父组件控制
defineExpose({
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style> 