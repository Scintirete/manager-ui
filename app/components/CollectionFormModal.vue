<template>
  <el-dialog
    v-model="dialogVisible"
:title="$t('collectionForm.title')"
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
      <el-form-item :label="$t('collectionForm.name')" prop="name">
        <el-input
          v-model="form.name"
:placeholder="$t('collectionForm.namePlaceholder')"
          :disabled="loading"
        />
      </el-form-item>

      <el-form-item :label="$t('collectionForm.metricType')" prop="metricType">
        <el-select
          v-model="form.metricType"
:placeholder="$t('collectionForm.metricPlaceholder')"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option :label="$t('collectionForm.l2Option')" :value="1" />
          <el-option :label="$t('collectionForm.cosineOption')" :value="2" />
          <el-option :label="$t('collectionForm.innerProductOption')" :value="3" />
        </el-select>
      </el-form-item>

      <el-divider content-position="center">{{ $t('collectionForm.hnswConfig') }}</el-divider>

      <el-form-item>
        <div class="form-help">
          {{ $t('collectionForm.hnswReference') }}
          <a :href="$t('collectionForm.hnswReferenceUrl')" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
            {{ $t('collectionForm.hnswReferenceText') }}
          </a>
        </div>
      </el-form-item>

      <el-form-item :label="$t('collectionForm.mParam')" prop="hnswM">
        <el-input-number
          v-model="form.hnswM"
          :min="2"
          :max="64"
          :step="1"
          style="width: 100%"
          :disabled="loading"
        />
        <div class="form-help">{{ $t('collectionForm.mParamHelp') }}</div>
      </el-form-item>

      <el-form-item :label="$t('collectionForm.efConstruction')" prop="hnswEfConstruction">
        <el-input-number
          v-model="form.hnswEfConstruction"
          :min="10"
          :max="2000"
          :step="10"
          style="width: 100%"
          :disabled="loading"
        />
        <div class="form-help">{{ $t('collectionForm.efConstructionHelp') }}</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          {{ $t('collectionForm.cancel') }}
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          {{ $t('collectionForm.create') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { HnswConfig } from '~/types/scintirete.d.ts'
import type { DistanceMetric } from '~/types/scintirete.d.ts'

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

// 国际化
const { t: $t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  metricType: 3 as DistanceMetric, // INNER_PRODUCT
  hnswM: 16,
  hnswEfConstruction: 200
})

const rules = computed((): FormRules => ({
  name: [
    { required: true, message: $t('collectionForm.nameRequired'), trigger: 'blur' },
    { min: 1, max: 50, message: $t('collectionForm.nameLength'), trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: $t('collectionForm.namePattern'), trigger: 'blur' }
  ],
  metricType: [
    { required: true, message: $t('collectionForm.metricRequired'), trigger: 'change' }
  ],
  hnswM: [
    { required: true, message: $t('collectionForm.mParamRequired'), trigger: 'blur' },
    { type: 'number', min: 2, max: 64, message: $t('collectionForm.mParamRange'), trigger: 'blur' }
  ],
  hnswEfConstruction: [
    { required: true, message: $t('collectionForm.efRequired'), trigger: 'blur' },
    { type: 'number', min: 10, max: 2000, message: $t('collectionForm.efRange'), trigger: 'blur' }
  ]
}))

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