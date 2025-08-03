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
  border: 1px solid var(--sc-border);
  border-radius: var(--sc-radius-lg);
  overflow: hidden;
  background: var(--sc-bg-primary);
  box-shadow: var(--sc-shadow-sm);
  transition: all var(--sc-transition-normal);
}

.page-card:hover {
  box-shadow: var(--sc-shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: calc(-1 * var(--sc-space-lg)) calc(-1 * var(--sc-space-lg)) 0 calc(-1 * var(--sc-space-lg));
  padding: var(--sc-space-md) var(--sc-space-lg);
  background: var(--sc-bg-secondary);
  border-bottom: 1px solid var(--sc-border);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--sc-text-primary);
}

.card-actions {
  display: flex;
  gap: var(--sc-space-sm);
  align-items: center;
}

.card-content {
  min-height: 200px;
  padding: var(--sc-space-lg);
}

.loading-container {
  padding: var(--sc-space-lg) 0;
}

.empty-container {
  padding: var(--sc-space-2xl) 0;
  text-align: center;
}

.main-content {
  width: 100%;
}

/* 对于表格等组件的特殊处理 */
.card-content :deep(.el-table) {
  margin: calc(-1 * var(--sc-space-lg)) calc(-1 * var(--sc-space-lg)) 0 calc(-1 * var(--sc-space-lg));
}

.card-content :deep(.el-table__header-wrapper) {
  background-color: var(--sc-bg-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sc-space-md);
    padding: var(--sc-space-md) var(--sc-space-lg);
  }
  
  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-content {
    padding: var(--sc-space-md);
  }
}
</style> 