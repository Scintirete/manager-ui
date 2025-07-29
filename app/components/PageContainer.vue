<template>
  <div class="page-container">
    <!-- 页面卡片 -->
    <el-card shadow="never" class="page-card">
      <!-- 卡片头部 -->
      <template #header v-if="title || $slots.header">
        <div class="card-header">
          <div class="card-title">
            <slot name="header">
              <span>{{ title }}</span>
            </slot>
          </div>
          <div class="card-actions" v-if="$slots.actions">
            <slot name="actions" />
          </div>
        </div>
      </template>

      <!-- 卡片内容 -->
      <div class="card-content">
        <!-- 加载状态 -->
        <div v-if="loading && !hasData" class="loading-container">
          <el-skeleton :rows="skeletonRows" animated />
        </div>

        <!-- 空状态 -->
        <div v-else-if="showEmpty && !loading" class="empty-container">
          <el-empty :description="emptyDescription">
            <div v-if="$slots.empty">
              <slot name="empty" />
            </div>
            <el-button v-else type="primary" @click="$emit('refresh')">
              重新加载
            </el-button>
          </el-empty>
        </div>

        <!-- 主要内容 -->
        <div v-else class="main-content">
          <slot />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  loading?: boolean
  hasData?: boolean
  showEmpty?: boolean
  emptyDescription?: string
  skeletonRows?: number
}

interface Emits {
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  loading: false,
  hasData: true,
  showEmpty: false,
  emptyDescription: '暂无数据',
  skeletonRows: 5
})

defineEmits<Emits>()
</script>

<style scoped>
.page-container {
  width: 100%;
}

.page-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -20px -20px 0 -20px;
  padding: 16px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-content {
  min-height: 200px;
}

.loading-container {
  padding: 20px 0;
}

.empty-container {
  padding: 40px 0;
  text-align: center;
}

.main-content {
  width: 100%;
}

/* 对于表格等组件的特殊处理 */
.card-content :deep(.el-table) {
  margin: -20px -20px 0 -20px;
}

.card-content :deep(.el-table__header-wrapper) {
  background-color: #fafbfc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 