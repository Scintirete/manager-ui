<template>
  <div class="connection-status">
    <div v-if="connection" class="status-content">
      <!-- 服务器信息 -->
      <div class="status-item">
        <el-icon class="status-icon" color="#409EFF"><Monitor /></el-icon>
        <span class="status-label">服务器:</span>
        <el-tag type="info" size="small">{{ connection.server }}:{{ connection.port }}</el-tag>
      </div>
      
      <!-- 连接模式 -->
      <div class="status-item">
        <el-icon class="status-icon" :color="connection.mode === 'proxy' ? '#E6A23C' : '#67C23A'">
          <Connection />
        </el-icon>
        <span class="status-label">模式:</span>
        <el-tag 
          :type="connection.mode === 'proxy' ? 'warning' : 'success'" 
          size="small"
        >
          {{ connection.mode === 'proxy' ? '服务器转发' : '客户端直连' }}
        </el-tag>
      </div>
      
      <!-- 当前数据库 -->
      <div v-if="currentDatabase" class="status-item">
        <el-icon class="status-icon" color="#67C23A"><Files /></el-icon>
        <span class="status-label">数据库:</span>
        <el-tag type="success" size="small">{{ currentDatabase }}</el-tag>
      </div>
      
      <!-- 连接名称（如果有） -->
      <div v-if="connection.name" class="status-item">
        <el-icon class="status-icon" color="#909399"><User /></el-icon>
        <span class="status-label">连接名:</span>
        <span class="connection-name">{{ connection.name }}</span>
      </div>
    </div>
    
    <!-- 无连接状态 -->
    <div v-else class="no-connection">
      <el-icon color="#F56C6C"><Warning /></el-icon>
      <span>未连接</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, Connection, Files, User, Warning } from '@element-plus/icons-vue'
import type { ConnectionConfig } from '~/composables/useApi'

interface Props {
  connection?: ConnectionConfig | null
  currentDatabase?: string
}

const props = withDefaults(defineProps<Props>(), {
  connection: null,
  currentDatabase: ''
})
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.status-icon {
  font-size: 14px;
}

.status-label {
  color: #606266;
  font-weight: 500;
}

.connection-name {
  color: #303133;
  font-weight: 500;
}

.no-connection {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #F56C6C;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .status-content {
    gap: 12px;
  }
  
  .status-item {
    font-size: 12px;
  }
}
</style> 