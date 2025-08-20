<template>
  <el-dialog 
    v-model="dialogVisible" 
:title="$t('insertResult.title')"
    width="600px"
    @close="handleClose"
  >
    <div class="result-content">
      <div class="success-info">
        <el-icon class="success-icon" color="#67C23A" size="48">
          <CircleCheck />
        </el-icon>
        <h3>{{ $t('insertResult.success') }}</h3>
      </div>
      
      <div class="result-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('insertResult.insertedCount')">
            <el-tag type="success" size="large">{{ result?.inserted_count || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('insertResult.generatedIds')">
            <div class="ids-container">
              <el-tag 
                v-for="id in result?.inserted_ids" 
                :key="id" 
                class="id-tag"
                size="small"
              >
                {{ id }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="result?.inserted_ids && result.inserted_ids.length > 0" class="copy-section">
        <el-input
          v-model="idsText"
          type="textarea"
          :rows="3"
          readonly
:placeholder="$t('insertResult.idsPlaceholder')"
        >
          <template #append>
            <el-button @click="copyIds" :icon="DocumentCopy">
              {{ $t('insertResult.copy') }}
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
    
    <template #footer>
      <el-button type="primary" @click="handleClose">
        {{ $t('insertResult.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { CircleCheck, DocumentCopy } from '@element-plus/icons-vue'

interface InsertResult {
  inserted_ids: string[]
  inserted_count: number
}

interface Props {
  visible: boolean
  result?: InsertResult | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  result: null
})

const emit = defineEmits<Emits>()

// 国际化
const { t: $t } = useI18n()

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const idsText = computed(() => {
  if (!props.result?.inserted_ids) return ''
  return props.result.inserted_ids.join(', ')
})

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
}

// 复制ID列表
const copyIds = async () => {
  try {
    await navigator.clipboard.writeText(idsText.value)
    ElMessage.success($t('insertResult.copySuccess'))
  } catch (error) {
    console.error('Failed to copy text:', error)
    ElMessage.error($t('insertResult.copyFailed'))
  }
}
</script>

<style scoped>
.result-content {
  text-align: center;
}

.success-info {
  margin-bottom: 24px;
}

.success-icon {
  margin-bottom: 16px;
}

.success-info h3 {
  margin: 0;
  color: #67C23A;
  font-size: 20px;
  font-weight: 600;
}

.result-details {
  margin-bottom: 24px;
}

.ids-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.id-tag {
  margin: 0;
}

.copy-section {
  text-align: left;
}

:deep(.el-descriptions__body) {
  background-color: #fafafa;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style> 