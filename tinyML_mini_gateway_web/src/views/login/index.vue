<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#0f9b8e"><Cpu /></el-icon>
        <h2>TinyML Mini Gateway</h2>
        <p class="login-subtitle">设备管理系统 v2.4.1</p>
      </div>
      <el-form :model="form" @submit.prevent="handleLogin" class="login-form">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember" label="记住登录状态" />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" @click="handleLogin" :loading="loading">
          登 录
        </el-button>
      </el-form>
      <div class="login-footer">
        <span>默认账号: admin / admin</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: 'admin',
  remember: true,
})

function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  setTimeout(() => {
    if (form.username === 'admin' && form.password === 'admin') {
      localStorage.setItem('tinyml_logged_in', 'true')
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error('用户名或密码错误')
    }
    loading.value = false
  }, 800)
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #16213e 50%, #1a1a2e 100%);
  position: relative;
  overflow: hidden;
}
.login-bg {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15,155,142,0.15) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(30,42,58,0.9);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
  z-index: 1;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h2 {
  margin-top: 12px;
  color: #e0e0e0;
  font-size: 22px;
}
.login-subtitle {
  color: #a0a0a0;
  font-size: 13px;
  margin-top: 6px;
}
.login-btn {
  width: 100%;
  background: #0f9b8e !important;
  border-color: #0f9b8e !important;
}
.login-btn:hover {
  background: #16c2b0 !important;
  border-color: #16c2b0 !important;
}
.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #666;
}
</style>
