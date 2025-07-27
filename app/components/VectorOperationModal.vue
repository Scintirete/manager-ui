<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="title"
    :width="width"
    @close="handleClose"
  >
    <el-form 
      ref="formRef" 
      :model="form" 
      :rules="rules"
      label-width="120px"
    >
      <!-- 嵌入模型选择 (插入和搜索操作需要) -->
      <el-form-item 
        v-if="['insert', 'search'].includes(operation)"
        label="嵌入模型" 
        prop="model"
      >
        <el-select 
          v-model="form.model" 
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

      <!-- 文本内容 (插入操作) -->
      <el-form-item 
        v-if="operation === 'insert'"
        label="文本内容" 
        prop="text"
      >
        <el-input 
          v-model="form.text"
          type="textarea" 
          :rows="4"
          placeholder="输入要转换为向量的文本内容"
        />
      </el-form-item>

      <!-- 元数据 (插入操作) -->
      <el-form-item 
        v-if="operation === 'insert'"
        label="元数据 (JSON)" 
        prop="metadata"
      >
        <el-input 
          v-model="form.metadata"
          type="textarea" 
          :rows="3"
          placeholder='{"key": "value", "tag": "example"}'
        />
      </el-form-item>

      <!-- 查询文本 (搜索操作) -->
      <el-form-item 
        v-if="operation === 'search'"
        label="查询文本" 
        prop="queryText"
      >
        <el-input 
          v-model="form.queryText"
          type="textarea" 
          :rows="3"
          placeholder="输入查询文本"
        />
      </el-form-item>

      <!-- 返回数量 (搜索操作) -->
      <el-form-item 
        v-if="operation === 'search'"
        label="返回数量" 
        prop="topK"
      >
        <el-input-number 
          v-model="form.topK" 
          :min="1" 
          :max="100"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 过滤条件 (搜索操作) -->
      <el-form-item 
        v-if="operation === 'search'"
        label="过滤条件"
      >
        <el-input 
          v-model="form.filter"
          placeholder="可选，元数据过滤条件"
        />
      </el-form-item>

      <!-- 向量ID列表 (删除操作) -->
      <el-form-item 
        v-if="operation === 'delete'"
        label="向量ID列表" 
        prop="ids"
      >
        <el-input 
          v-model="form.ids"
          type="textarea" 
          :rows="4"
          placeholder="输入要删除的向量ID，用逗号分隔，例如: 1,2,3"
        />
      </el-form-item>
    </el-form>

    <!-- 搜索结果展示 -->
    <div v-if="operation === 'search' && searchResults.length > 0" class="search-results">
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
      <el-button @click="handleClose">
        {{ operation === 'search' ? '关闭' : '取消' }}
      </el-button>
      <el-button 
        :type="operation === 'delete' ? 'danger' : 'primary'"
        @click="handleSubmit"
        :loading="submitting"
      >
        {{ getSubmitButtonText() }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { EmbeddingModel, SearchResultItem } from '../../types/scintirete'

interface Props {
  visible: boolean
  operation: 'insert' | 'search' | 'delete'
  embeddingModels?: EmbeddingModel[]
  modelsLoading?: boolean
  searchResults?: SearchResultItem[]
}

interface FormData {
  model: string
  text: string
  metadata: string
  queryText: string
  topK: number
  filter: string
  ids: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: FormData): void
}

const props = withDefaults(defineProps<Props>(), {
  embeddingModels: () => [],
  modelsLoading: false,
  searchResults: () => []
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

const title = computed(() => {
  const titles = {
    insert: '插入向量',
    search: '搜索向量', 
    delete: '删除向量'
  }
  return titles[props.operation]
})

const width = computed(() => {
  return props.operation === 'search' ? '800px' : '600px'
})

// 表单数据
const form = ref<FormData>({
  model: '',
  text: '',
  metadata: '',
  queryText: '',
  topK: 10,
  filter: '',
  ids: ''
})

// 表单验证规则
const rules = computed((): FormRules => {
  const baseRules: FormRules = {}
  
  if (['insert', 'search'].includes(props.operation)) {
    baseRules.model = [
      { required: true, message: '请选择嵌入模型', trigger: 'change' }
    ]
  }
  
  if (props.operation === 'insert') {
    baseRules.text = [
      { required: true, message: '请输入文本内容', trigger: 'blur' }
    ]
  }
  
  if (props.operation === 'search') {
    baseRules.queryText = [
      { required: true, message: '请输入查询文本', trigger: 'blur' }
    ]
    baseRules.topK = [
      { required: true, message: '请输入返回数量', trigger: 'blur' },
      { type: 'number', min: 1, max: 100, message: '返回数量范围：1-100', trigger: 'blur' }
    ]
  }
  
  if (props.operation === 'delete') {
    baseRules.ids = [
      { required: true, message: '请输入向量ID', trigger: 'blur' }
    ]
  }
  
  return baseRules
})

// 重置表单
const resetForm = () => {
  form.value = {
    model: '',
    text: '',
    metadata: '',
    queryText: '',
    topK: 10,
    filter: '',
    ids: ''
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

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    emit('submit', form.value)
    submitting.value = false
    
    // 搜索操作不关闭对话框，其他操作关闭
    if (props.operation !== 'search') {
      handleClose()
    }
  } catch (error) {
    console.error('Form validation failed:', error)
    submitting.value = false
  }
}

// 获取提交按钮文本
const getSubmitButtonText = () => {
  const texts = {
    insert: '插入',
    search: '搜索',
    delete: '删除'
  }
  return texts[props.operation]
}

// 监听对话框显示状态，重置表单
watch(() => props.visible, (visible) => {
  if (visible) {
    resetForm()
  }
})

// 暴露提交状态给父组件使用
defineExpose({
  submitting: readonly(submitting)
})
</script>

<style scoped>
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
</style> 