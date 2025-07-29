<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="layout-header">
      <div class="header-content">
        <div class="logo-section">
          <NuxtLink to="/" style="text-decoration: none;">
            <h1 class="logo">Scintirete Manager</h1>
          </NuxtLink>
          <ConnectionStatus 
            :connection="currentConnection" 
            :current-database="currentDatabase"
          />
        </div>
        <div class="header-actions">
          <slot name="header-actions" />
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-container>
      <!-- 侧边导航 -->
      <!-- <el-aside width="240px" class="layout-aside" v-if="showSidebar">
        <el-menu
          :default-active="currentPath"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><Connection /></el-icon>
            <span>连接管理</span>
          </el-menu-item>
          <el-menu-item index="/database" v-if="currentConnection" :disabled="!currentConnection">
            <el-icon><Document /></el-icon>
            <span>数据库管理</span>
          </el-menu-item>
          <el-menu-item index="/collection" v-if="currentDatabase" :disabled="!currentDatabase">
            <el-icon><Files /></el-icon>
            <span>{{ currentDatabase }} - 集合管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside> -->

      <!-- 主内容区域 -->
      <el-main class="layout-main">
        <!-- 面包屑导航 -->
        <!-- <div class="breadcrumb-container" v-if="showBreadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">连接管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentConnection" :to="{ path: '/database', query: { connection: connectionId } }">
              数据库管理
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentDatabase">
              {{ currentDatabase }} - 集合管理
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div> -->

        <!-- 页面标题区域 -->
        <div class="page-header" v-if="pageTitle">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <div class="page-actions">
            <slot name="page-actions" />
          </div>
        </div>

        <!-- 页面内容 -->
        <div class="page-content">
          <slot />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import type { ConnectionConfig } from '../composables/useApi'

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI - 集合管理'
})

interface Props {
  pageTitle?: string
  currentConnection?: ConnectionConfig | null
  currentDatabase?: string
  connectionId?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageTitle: '',
  currentConnection: null,
  currentDatabase: '',
  connectionId: ''
})

</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.layout-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 64px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}



.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.layout-aside {
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
}

.layout-main {
  padding: 0;
  background-color: #f5f7fa;
  overflow-x: auto;
}

.breadcrumb-container {
  background-color: #ffffff;
  padding: 12px 24px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 0;
}

.page-header {
  background-color: #ffffff;
  padding: 20px 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-content {
  /* padding: 0 24px 24px; */
  /* max-width: 1600px; */
  margin: 0 auto;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .layout-aside {
    width: 200px !important;
  }
  
  .page-content {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .connection-info {
    display: none;
  }
  
  .layout-aside {
    width: 180px !important;
  }
  
  .page-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .page-content {
    padding: 0 16px 16px;
  }
  
  .breadcrumb-container {
    padding: 8px 16px;
  }
}

@media (max-width: 600px) {
  .layout-aside {
    width: 60px !important;
  }
  
  .sidebar-menu .el-menu-item span {
    display: none;
  }
}
</style> 