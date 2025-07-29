<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建集合"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="集合名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入集合名称"
          :disabled="loading"
        />
      </el-form-item>

      <el-form-item label="距离度量" prop="metricType">
        <el-select
          v-model="form.metricType"
          placeholder="请选择距离度量方法"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option label="L2 (欧几里得距离)" :value="1" />
          <el-option label="Cosine (余弦相似度)" :value="2" />
          <el-option label="Inner Product (内积)" :value="3" />
        </el-select>
      </el-form-item>

      <el-divider content-position="center">HNSW 参数配置</el-divider>

      <el-form-item>
        <div class="form-help">
          可参考文档：<a href="https://github.com/Scintirete/Scintirete/blob/main/docs/usage/1_HNSW_%E8%B6%85%E5%8F%82%E6%95%B0%E8%B0%83%E6%95%B4.md" target="_blank">HNSW_超参数调整</a> 进行定制化调整
        </div>
      </el-form-item>

      <el-form-item label="M 参数" prop="hnswM">
        <el-input-number
          v-model="form.hnswM"
          :min="2"
          :max="64"
          :step="1"
          style="width: 100%"
          :disabled="loading"
        />
        <div class="form-help">双向链接数量，影响构建时间和搜索质量 (推荐: 16)</div>
      </el-form-item>

      <el-form-item label="EF Construction" prop="hnswEfConstruction">
        <el-input-number
          v-model="form.hnswEfConstruction"
          :min="10"
          :max="2000"
          :step="10"
          style="width: 100%"
          :disabled="loading"
        />
        <div class="form-help">构建时搜索深度，影响构建质量和时间 (推荐: 200)</div>
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
import { ref, reactive, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { DistanceMetric, type HnswConfig } from '~/types/scintirete.d.ts'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: { 
    name: string 
    metricType: DistanceMetric
    hnswConfig: HnswConfig
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  metricType: DistanceMetric.INNER_PRODUCT as DistanceMetric,
  hnswM: 16,
  hnswEfConstruction: 200
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入集合名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  metricType: [
    { required: true, message: '请选择距离度量方法', trigger: 'change' }
  ],
  hnswM: [
    { required: true, message: 'M 参数不能为空', trigger: 'blur' },
    { type: 'number', min: 2, max: 64, message: 'M 参数必须在 2-64 之间', trigger: 'blur' }
  ],
  hnswEfConstruction: [
    { required: true, message: 'EF Construction 不能为空', trigger: 'blur' },
    { type: 'number', min: 10, max: 2000, message: 'EF Construction 必须在 10-2000 之间', trigger: 'blur' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleClose = () => {
  resetForm()
  emit('update:visible', false)
}

const resetForm = () => {
  form.name = ''
  form.metricType = 3
  form.hnswM = 16
  form.hnswEfConstruction = 200
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', {
      name: form.name,
      metricType: form.metricType,
      hnswConfig: {
        m: form.hnswM,
        ef_construction: form.hnswEfConstruction
      }
    })
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

// 当对话框打开时重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
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

.form-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.el-divider {
  margin: 20px 0;
}
</style> 