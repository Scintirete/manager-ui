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
      <!-- 插入类型选择 (插入操作) -->
      <el-form-item 
        v-if="operation === 'insert'"
        :label="$t('vectorModal.insertType')" 
        prop="insertType"
      >
        <el-radio-group v-model="form.insertType">
          <el-radio value="array">{{ $t('vectorModal.arrayInsert') }}</el-radio>
          <el-radio value="embedding">{{ $t('vectorModal.embeddingInsert') }}</el-radio>
        </el-radio-group>
        <p class="help-text">{{ $t('vectorModal.arrayInsertDesc') }}</p>
      </el-form-item>

      <!-- 搜索类型选择 (搜索操作) -->
      <el-form-item 
        v-if="operation === 'search'"
        :label="$t('vectorModal.searchType')" 
        prop="searchType"
      >
        <el-radio-group v-model="form.searchType">
          <el-radio value="text">{{ $t('vectorModal.textSearch') }}</el-radio>
          <el-radio value="vector">{{ $t('vectorModal.vectorSearch') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 嵌入模型选择 (嵌入插入和文本搜索需要) -->
      <el-form-item 
        v-if="(operation === 'insert' && form.insertType === 'embedding') || (operation === 'search' && form.searchType === 'text')"
        :label="$t('vectorModal.embeddingModel')" 
        prop="model"
      >
        <el-select 
          v-model="form.model" 
:placeholder="$t('vectorModal.selectModel')"
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
        <p class="help-text">{{ $t('vectorModal.modelNote') }}</p>
      </el-form-item>

      <!-- 向量数组 (数组插入) -->
      <el-form-item 
        v-if="operation === 'insert' && form.insertType === 'array'"
        :label="$t('vectorModal.vectorArray')" 
        prop="vectorArray"
      >
        <el-input 
          v-model="form.vectorArray"
          type="textarea" 
          :rows="6"
:placeholder="$t('vectorModal.vectorArrayPlaceholder')"
        />
        <p class="help-text">{{ $t('vectorModal.vectorArrayFormat') }}</p>
      </el-form-item>

      <!-- 文本内容 (嵌入插入) -->
      <el-form-item 
        v-if="operation === 'insert' && form.insertType === 'embedding'"
        :label="$t('vectorModal.textContent')" 
        prop="text"
      >
        <el-input 
          v-model="form.text"
          type="textarea" 
          :rows="4"
          :placeholder="$t('vectorModal.textPlaceholder')"
        />
      </el-form-item>

      <!-- 元数据 (插入操作) -->
      <el-form-item 
        v-if="operation === 'insert'"
        :label="$t('vectorModal.metadata')" 
        prop="metadata"
      >
        <el-input 
          v-model="form.metadata"
          type="textarea" 
          :rows="3"
          :placeholder="$t('vector.metadataPlaceholder')"
        />
      </el-form-item>

      <!-- 查询文本 (文本搜索) -->
      <el-form-item 
        v-if="operation === 'search' && form.searchType === 'text'"
        :label="$t('vectorModal.queryText')" 
        prop="queryText"
      >
        <el-input 
          v-model="form.queryText"
          type="textarea" 
          :rows="3"
          :placeholder="$t('vectorModal.queryTextPlaceholder')"
        />
      </el-form-item>

      <!-- 查询向量 (向量搜索) -->
      <el-form-item 
        v-if="operation === 'search' && form.searchType === 'vector'"
        :label="$t('vectorModal.queryVector')" 
        prop="queryVector"
      >
        <el-input 
          v-model="form.queryVector"
          type="textarea" 
          :rows="4"
          :placeholder="$t('vectorModal.queryVectorPlaceholder')"
        />
        <p class="help-text">{{ $t('vectorModal.queryVectorFormat') }}</p>
      </el-form-item>

      <!-- 返回数量 (搜索操作) -->
      <el-form-item 
        v-if="operation === 'search'"
        :label="$t('vectorModal.topK')" 
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
      <!-- <el-form-item 
        v-if="operation === 'search'"
        label="过滤条件"
      >
        <el-input 
          v-model="form.filter"
          placeholder="可选，元数据过滤条件"
        />
      </el-form-item> -->

      <!-- 向量ID列表 (删除操作) -->
      <el-form-item 
        v-if="operation === 'delete'"
        :label="$t('vectorModal.vectorIds')" 
        prop="ids"
      >
        <el-input 
          v-model="form.ids"
          type="textarea" 
          :rows="4"
:placeholder="$t('vectorModal.vectorIdsPlaceholder')"
        />
      </el-form-item>

      <!-- 搜索类型说明 (搜索操作) -->
      <div v-if="operation === 'search'" class="search-type-explanation">
        <p class="help-text">{{ $t('vectorModal.searchTypeDesc') }}</p>
      </div>
    </el-form>

    <!-- 搜索结果展示 -->
    <div v-if="operation === 'search' && searchResults.length > 0" class="search-results">
      <h4>{{ $t('vectorModal.searchResults') }}</h4>
      <p class="help-text">{{ $t('vectorModal.searchResultsNote') }}</p>
      <el-table :data="searchResults" size="small" max-height="300">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="distance" :label="$t('vectorModal.distance')" width="100">
          <template #default="{ row }">
            {{ row.distance.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column prop="metadata" :label="$t('vector.metadata')">
          <template #default="{ row }">
            <code>{{ JSON.stringify(row.metadata) }}</code>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">
        {{ operation === 'search' ? $t('vectorModal.close') : $t('vectorModal.cancel') }}
      </el-button>
      <el-button 
        :type="operation === 'delete' ? 'danger' : 'primary'"
        @click="handleSubmit"
        :loading="submitting || operationLoading"
      >
        {{ getSubmitButtonText() }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { EmbeddingModel, SearchResultItem } from '~~/types/scintirete'

interface Props {
  visible: boolean
  operation: 'insert' | 'search' | 'delete'
  embeddingModels?: EmbeddingModel[]
  modelsLoading?: boolean
  searchResults?: SearchResultItem[]
  operationLoading?: boolean
}

interface FormData {
  model: string
  insertType: 'array' | 'embedding'
  text: string
  vectorArray: string
  metadata: string
  queryText: string
  queryVector: string
  searchType: 'text' | 'vector'
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
  searchResults: () => [],
  operationLoading: false
})

const emit = defineEmits<Emits>()

// 国际化
const { t: $t } = useI18n()

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
    insert: $t('vector.insert'),
    search: $t('vector.search'), 
    delete: $t('vector.delete')
  }
  return titles[props.operation]
})

const width = computed(() => {
  return props.operation === 'search' ? '800px' : '600px'
})

// 表单数据
const form = ref<FormData>({
  model: '',
  insertType: 'array',
  text: '',
  vectorArray: '',
  metadata: '',
  queryText: '',
  queryVector: '',
  searchType: 'vector',
  topK: 10,
  filter: '',
  ids: ''
})

// 表单验证规则
const rules = computed((): FormRules => {
  const baseRules: FormRules = {}
  
  // 插入操作验证
  if (props.operation === 'insert') {
    baseRules.insertType = [
      { required: true, message: '请选择插入类型', trigger: 'change' }
    ]
    
    if (form.value.insertType === 'embedding') {
      baseRules.model = [
        { required: true, message: '请选择嵌入模型', trigger: 'change' }
      ]
      baseRules.text = [
        { required: true, message: '请输入文本内容', trigger: 'blur' }
      ]
    } else if (form.value.insertType === 'array') {
      baseRules.vectorArray = [
        { required: true, message: '请输入向量数组', trigger: 'blur' }
      ]
    }
  }
  
  // 搜索操作验证
  if (props.operation === 'search') {
    baseRules.searchType = [
      { required: true, message: '请选择搜索类型', trigger: 'change' }
    ]
    
    if (form.value.searchType === 'text') {
      baseRules.model = [
        { required: true, message: '请选择嵌入模型', trigger: 'change' }
      ]
      baseRules.queryText = [
        { required: true, message: '请输入查询文本', trigger: 'blur' }
      ]
    } else if (form.value.searchType === 'vector') {
      baseRules.queryVector = [
        { required: true, message: '请输入查询向量', trigger: 'blur' }
      ]
    }
    
    baseRules.topK = [
      { required: true, message: '请输入返回数量', trigger: 'blur' },
      { type: 'number', min: 1, max: 100, message: '返回数量范围：1-100', trigger: 'blur' }
    ]
  }
  
  // 删除操作验证
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
    insertType: 'array',
    text: '',
    vectorArray: '',
    metadata: '',
    queryText: '',
    queryVector: '',
    searchType: 'vector',
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
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    submitting.value = false
  }
}

// 获取提交按钮文本
const getSubmitButtonText = () => {
  const texts = {
    insert: $t('vectorModal.insertButton'),
    search: $t('vectorModal.searchButton'),
    delete: $t('vectorModal.deleteButton')
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

.help-text {
  color: #999;
  font-size: 12px;
  margin-top: 10px;
}

.search-type-explanation {
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.search-type-explanation .help-text {
  margin-top: 0;
  text-align: center;
  font-style: italic;
}
</style> 