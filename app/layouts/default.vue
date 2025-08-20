<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="layout-header">
      <div class="header-content">
        <div class="logo-section">
          <NuxtLink :to="$localePath('/')" style="text-decoration: none;" class="logo-link">
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
           <!-- GitHub 链接 -->
           <div class="github-links">
            <el-dropdown trigger="hover" placement="bottom-end">
              <div class="github-button">
                <el-icon class="github-icon"><Link /></el-icon>
                <span class="github-text">{{ $t('nav.docsAndResources') }}</span>
                <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="github-dropdown">
                  <el-dropdown-item>
                    <a href="http://scintirete.cloud.wj2015.com/" target="_blank" class="github-link">
                      <el-icon><Document /></el-icon>
                      <div class="link-content">
                        <div class="link-title">{{ $t('nav.officialWebsite') }}</div>
                      </div>
                    </a>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://github.com/Scintirete/Scintirete/" target="_blank" class="github-link">
                      <el-icon><Link /></el-icon>
                      <div class="link-content">
                        <div class="link-title">{{ $t('nav.sourceCode') }}</div>
                      </div>
                    </a>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://github.com/Scintirete/manager-ui" target="_blank" class="github-link">
                      <el-icon><Link /></el-icon>
                      <div class="link-content">
                        <div class="link-title">{{ $t('nav.managerUiSource') }}</div>
                      </div>
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <!-- 语言切换器 -->
          <div class="language-switcher">
            <el-dropdown trigger="hover" placement="bottom-end">
              <div class="language-button">
                <span class="language-icon">🌐</span>
                <span class="language-text">{{ $t('language.switch') }}</span>
                <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="language-dropdown">
                  <el-dropdown-item 
                    v-for="locale in availableLocales" 
                    :key="locale.code"
                    @click="switchToLocale(locale.code)"
                    :class="{ 'is-active': currentLocale === locale.code }"
                  >
                    <div class="locale-item">
                      <span class="locale-name">{{ locale.name }}</span>
                      <el-icon v-if="currentLocale === locale.code" class="check-icon">
                        <Check />
                      </el-icon>
                    </div>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
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
import { Link, ArrowDown, Monitor, Document, Check } from '@element-plus/icons-vue'
import type { ConnectionConfig } from '../composables/useApi'

// 设置页面元信息
useHead({
  title: 'Scintirete Manager UI'
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

// 国际化支持
const { locale, locales, setLocale, t: $t } = useI18n()
const $localePath = useLocalePath()

// 可用语言列表
const availableLocales = computed(() => {
  return locales.value.map(l => ({
    code: l.code,
    name: l.name
  }))
})

// 当前语言
const currentLocale = computed(() => locale.value)

// 切换语言
const switchToLocale = async (localeCode: string) => {
  await setLocale(localeCode as 'en' | 'zh')
}

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

/* Language Switcher Styles */
.language-switcher {
  margin-right: var(--sc-space-md);
}

.language-button {
  display: flex;
  align-items: center;
  gap: var(--sc-space-xs);
  padding: var(--sc-space-sm) var(--sc-space-md);
  background: var(--sc-bg-primary);
  border: 1px solid var(--sc-border);
  border-radius: var(--sc-radius-sm);
  cursor: pointer;
  transition: all var(--sc-transition-fast);
  color: var(--sc-text-secondary);
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.language-button:hover {
  background: var(--sc-bg-secondary);
  border-color: var(--sc-primary-start);
  color: var(--sc-primary-start);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(217, 119, 6, 0.1);
}

.language-icon {
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.language-text {
  font-weight: 500;
}

.language-dropdown .el-dropdown-item {
  padding: 0;
}

.locale-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sc-space-sm) var(--sc-space-md);
  width: 100%;
  transition: all var(--sc-transition-fast);
}

.locale-item:hover {
  /* background: var(--sc-bg-secondary); */
  color: var(--sc-primary-start);
}

.locale-name {
  font-weight: 500;
  font-size: 14px;
}

.check-icon {
  padding-left: 10px;
  font-size: 16px;
  color: var(--sc-primary-start);
}

.el-dropdown-item.is-active .locale-item {
  background: var(--sc-bg-secondary);
  color: var(--sc-primary-start);
}

/* GitHub Links Styles */
.github-links {
  margin-left: var(--sc-space-md);
}

.github-button {
  display: flex;
  align-items: center;
  gap: var(--sc-space-xs);
  padding: var(--sc-space-sm) var(--sc-space-md);
  background: var(--sc-bg-primary);
  border: 1px solid var(--sc-border);
  border-radius: var(--sc-radius-sm);
  cursor: pointer;
  transition: all var(--sc-transition-fast);
  color: var(--sc-text-secondary);
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.github-button:hover {
  background: var(--sc-bg-secondary);
  border-color: var(--sc-primary-start);
  color: var(--sc-primary-start);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(217, 119, 6, 0.1);
}

.github-icon {
  font-size: 16px;
}

.github-text {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 12px;
  transition: transform var(--sc-transition-fast);
}

.github-button:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.github-link {
  display: flex;
  align-items: center;
  gap: var(--sc-space-sm);
  padding: var(--sc-space-sm) 0;
  text-decoration: none;
  color: var(--sc-text-primary);
  transition: all var(--sc-transition-fast);
  width: 100%;
}

.github-link:hover {
  color: var(--sc-primary-start);
  background: var(--sc-bg-secondary);
  margin: 0 -12px;
  padding: var(--sc-space-sm) 12px;
  border-radius: var(--sc-radius-sm);
}

.github-link .el-icon {
  font-size: 18px;
  color: var(--sc-text-tertiary);
  transition: color var(--sc-transition-fast);
}

.github-link:hover .el-icon {
  color: var(--sc-primary-start);
}

.link-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.link-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
  color: inherit;
}

.link-url {
  font-size: 12px;
  color: var(--sc-text-tertiary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  margin-top: 2px;
  transition: color var(--sc-transition-fast);
}

.github-link:hover .link-url {
  color: var(--sc-primary-start);
}

/* 语言切换器和 GitHub 链接响应式优化 */
@media (max-width: 768px) {
  .language-switcher {
    margin-right: var(--sc-space-sm);
  }
  
  .language-text {
    display: none;
  }
  
  .language-button {
    padding: var(--sc-space-sm);
    min-width: 40px;
    justify-content: center;
  }
  
  .github-links {
    margin-left: var(--sc-space-sm);
  }
  
  .github-text {
    display: none;
  }
  
  .github-button {
    padding: var(--sc-space-sm);
    min-width: 40px;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .language-switcher {
    margin-right: var(--sc-space-xs);
  }
  
  .github-links {
    display: none;
  }
}
</style> 