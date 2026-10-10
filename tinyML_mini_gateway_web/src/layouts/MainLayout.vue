<template>
  <el-container class="main-layout">
    <el-aside :width="store.sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo-area">
        <el-icon :size="28" color="#0f9b8e"><Cpu /></el-icon>
        <span v-show="!store.sidebarCollapsed" class="logo-text">TinyML Gateway</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="store.sidebarCollapsed"
        background-color="#16213e"
        text-color="#a0a0a0"
        active-text-color="#16c2b0"
        router
        class="sidebar-menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="store.toggleSidebar" :size="20">
            <Fold v-if="!store.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <span class="current-page">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <div class="status-indicator">
            <span class="status-dot" :class="deviceOnline ? 'online' : 'offline'"></span>
            <span class="status-text">设备层 {{ deviceOnline ? '在线' : '离线' }}</span>
          </div>
          <div class="status-indicator">
            <span class="status-dot online"></span>
            <span class="status-text">RS485 在线</span>
          </div>
          <div class="status-indicator">
            <span class="status-dot" :class="mqttStatus"></span>
            <span class="status-text">MQTT {{ mqttStatusText }}</span>
          </div>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="28" style="background:#0f9b8e">管</el-avatar>
              <span class="username">admin</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="about">关于设备</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../store'
import { pingDeviceLayer } from '../utils/deviceApi'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const deviceOnline = ref(false)
let healthTimer = null
onMounted(async () => {
  deviceOnline.value = await pingDeviceLayer()
  healthTimer = setInterval(async () => {
    deviceOnline.value = await pingDeviceLayer()
  }, 5000)
})
onUnmounted(() => { if (healthTimer) clearInterval(healthTimer) })

const menuItems = [
  { path: '/dashboard', title: '数据看板', icon: 'DataBoard' },
  { path: '/network', title: '网络设置', icon: 'Connection' },
  { path: '/modbus', title: 'RS485 Modbus', icon: 'SetUp' },
  { path: '/sensor', title: '传感器配置', icon: 'Cpu' },
  { path: '/model', title: '模型管理', icon: 'MagicStick' },
  { path: '/alarm', title: '告警设置', icon: 'Bell' },
  { path: '/mqtt', title: '消息服务', icon: 'Promotion' },
  { path: '/output', title: '数据输出', icon: 'Upload' },
  { path: '/system', title: '系统管理', icon: 'Setting' },
  { path: '/about', title: '关于设备', icon: 'InfoFilled' },
]

const currentTitle = computed(() => {
  const matched = route.matched[route.matched.length - 1]
  return matched?.meta?.title || 'TinyML Gateway'
})

const mqttStatus = computed(() => store.mqttConfig.status === 'connected' ? 'online' : 'offline')
const mqttStatusText = computed(() => store.mqttConfig.status === 'connected' ? '已连接' : '已断开')

function handleCommand(cmd) {
  if (cmd === 'logout') {
    localStorage.removeItem('tinyml_logged_in')
    router.push('/login')
  } else if (cmd === 'about') {
    router.push('/about')
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100vw;
}
.sidebar {
  background: #16213e;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #0f9b8e;
  white-space: nowrap;
}
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
}
.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}
.app-header {
  height: 56px;
  background: #1e2a3a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  cursor: pointer;
  color: #a0a0a0;
  transition: color 0.2s;
}
.collapse-btn:hover {
  color: #16c2b0;
}
.current-page {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.online {
  background: #2ecc71;
  box-shadow: 0 0 6px #2ecc71;
}
.status-dot.offline {
  background: #e74c3c;
  box-shadow: 0 0 6px #e74c3c;
}
.status-text {
  font-size: 12px;
  color: #a0a0a0;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  color: #e0e0e0;
  font-size: 14px;
}
.app-main {
  padding: 0;
  background: #1a1a2e;
  overflow: hidden;
}
</style>
