import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue')
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/dashboard/index.vue'), meta: { title: '数据看板', icon: 'DataBoard' } },
      { path: 'network', name: 'Network', component: () => import('../views/network/index.vue'), meta: { title: '网络设置', icon: 'Connection' } },
      { path: 'modbus', name: 'Modbus', component: () => import('../views/modbus/index.vue'), meta: { title: 'RS485 Modbus', icon: 'SetUp' } },
      { path: 'sensor', name: 'Sensor', component: () => import('../views/sensor/index.vue'), meta: { title: '传感器配置', icon: 'Cpu' } },
      { path: 'model', name: 'Model', component: () => import('../views/model/index.vue'), meta: { title: '模型管理', icon: 'MagicStick' } },
      { path: 'alarm', name: 'Alarm', component: () => import('../views/alarm/index.vue'), meta: { title: '告警设置', icon: 'Bell' } },
      { path: 'mqtt', name: 'MQTT', component: () => import('../views/mqtt/index.vue'), meta: { title: '消息服务', icon: 'Promotion' } },
      { path: 'output', name: 'Output', component: () => import('../views/output/index.vue'), meta: { title: '数据输出', icon: 'Upload' } },
      { path: 'system', name: 'System', component: () => import('../views/system/index.vue'), meta: { title: '系统管理', icon: 'Setting' } },
      { path: 'about', name: 'About', component: () => import('../views/about/index.vue'), meta: { title: '关于设备', icon: 'InfoFilled' } },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('tinyml_logged_in')
  if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
