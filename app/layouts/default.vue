<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="layout-header">
      <div class="header-content">
        <div class="logo-section">
          <NuxtLink to="/" style="text-decoration: none;" class="logo-link">
            <div class="logo-container">
              <img src="/logo.png" alt="Scintirete Logo" class="logo-image" />
              <div class="logo-text">
                <h1 class="logo">Scintirete</h1>
                <span class="logo-subtitle">Manager</span>
              </div>
            </div>
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
  background: var(--sc-gradient-bg);
}

.layout-header {
  background: var(--sc-bg-primary);
  border-bottom: 1px solid var(--sc-border);
  padding: 0;
  height: var(--sc-header-height);
  box-shadow: var(--sc-shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 var(--sc-space-lg);
  max-width: 1280px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--sc-space-lg);
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: opacity var(--sc-transition-fast);
}

.logo-link:hover {
  opacity: 0.8;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: var(--sc-space-sm);
}

.logo-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: var(--sc-radius-sm);
}

.logo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: var(--sc-gradient-logo);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  filter: drop-shadow(0 2px 4px rgba(217, 119, 6, 0.2));
  transition: all var(--sc-transition-normal);
}

.logo:hover {
  filter: drop-shadow(0 4px 8px rgba(217, 119, 6, 0.3));
  transform: scale(1.02);
}

.logo-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--sc-text-secondary);
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--sc-space-md);
}

.layout-aside {
  background: var(--sc-bg-primary);
  border-right: 1px solid var(--sc-border);
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
  background: transparent;
  overflow-x: auto;
}

.breadcrumb-container {
  background: var(--sc-bg-primary);
  padding: var(--sc-space-md) var(--sc-space-lg);
  border-bottom: 1px solid var(--sc-border);
  margin-bottom: 0;
}

.page-header {
  background: var(--sc-bg-primary);
  padding: var(--sc-space-lg);
  margin-bottom: var(--sc-space-lg);
  border-bottom: 1px solid var(--sc-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--sc-radius-lg);
  margin: var(--sc-space-lg);
  margin-bottom: var(--sc-space-lg);
  box-shadow: var(--sc-shadow-sm);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--sc-text-primary);
}

.page-actions {
  display: flex;
  gap: var(--sc-space-md);
  align-items: center;
}

.page-content {
  padding: 0 var(--sc-space-lg) var(--sc-space-lg);
  max-width: 1280px;
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
    padding: 0 var(--sc-space-md);
  }
  
  .logo {
    font-size: 20px;
  }
  
  .logo-subtitle {
    font-size: 12px;
  }
  
  .logo-image {
    width: 32px;
    height: 32px;
  }
  
  .connection-info {
    display: none;
  }
  
  .layout-aside {
    width: 180px !important;
  }
  
  .page-header {
    padding: var(--sc-space-md);
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sc-space-md);
  }
  
  .page-content {
    padding: 0 var(--sc-space-md) var(--sc-space-md);
  }
  
  .breadcrumb-container {
    padding: var(--sc-space-sm) var(--sc-space-md);
  }
}

@media (max-width: 600px) {
  .layout-aside {
    width: 60px !important;
  }
  
  .sidebar-menu .el-menu-item span {
    display: none;
  }
  
  .logo-container {
    flex-direction: column;
    gap: 4px;
  }
  
  .logo-text {
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
  
  .logo-subtitle {
    margin-top: 0;
  }
}
</style> 