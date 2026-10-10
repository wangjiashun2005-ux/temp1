<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">消息服务配置</span>
      <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
    </div>
    <div class="card-grid">
      <el-card shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>MQTT Broker 设置</span>
            <el-tag :type="store.mqttConfig.status === 'connected' ? 'success' : 'danger'" effect="dark" size="small">
              {{ store.mqttConfig.status === 'connected' ? '已连接' : '已断开' }}
            </el-tag>
          </div>
        </template>
        <el-form :model="form" label-width="120px" label-position="left">
          <el-form-item label="启用 MQTT">
            <el-switch v-model="form.enabled" />
          </el-form-item>
          <el-form-item label="Broker 地址">
            <el-input v-model="form.broker" placeholder="例: 192.168.1.50" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="form.port" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="Client ID">
            <el-input v-model="form.clientId" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="Keep Alive (s)">
            <el-input-number v-model="form.keepAlive" :min="10" :max="600" />
          </el-form-item>
          <el-form-item label="Clean Session">
            <el-switch v-model="form.cleanSession" />
          </el-form-item>
          <el-form-item label="QoS">
            <el-radio-group v-model="form.qos">
              <el-radio :value="0">QoS 0</el-radio>
              <el-radio :value="1">QoS 1</el-radio>
              <el-radio :value="2">QoS 2</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="基础 Topic">
            <el-input v-model="form.baseTopic" placeholder="例: tinyml/gw01/" />
          </el-form-item>
          <el-form-item label="TLS/SSL">
            <el-switch v-model="form.useTLS" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never">
        <template #header>连接状态与统计</template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="连接状态">
            <el-tag :type="connected ? 'success' : 'danger'" effect="dark" size="small">{{ connected ? '已连接' : '已断开' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Broker 地址">{{ form.broker }}:{{ form.port }}</el-descriptions-item>
          <el-descriptions-item label="Client ID">{{ form.clientId }}</el-descriptions-item>
          <el-descriptions-item label="已发送消息">{{ msgSent }}</el-descriptions-item>
          <el-descriptions-item label="已接收消息">{{ msgRecv }}</el-descriptions-item>
          <el-descriptions-item label="重连次数">{{ reconnects }}</el-descriptions-item>
          <el-descriptions-item label="最后消息时间">{{ lastMsgTime }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;display:flex;gap:8px">
          <el-button :type="connected ? 'danger' : 'success'" @click="toggleConnect">
            {{ connected ? '断开连接' : '连接' }}
          </el-button>
          <el-button @click="sendTestMsg" :disabled="!connected">发送测试消息</el-button>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>Topic 订阅管理</template>
        <el-table :data="subscriptions" size="small">
          <el-table-column prop="topic" label="Topic" />
          <el-table-column prop="qos" label="QoS" width="70" />
          <el-table-column prop="messages" label="消息数" width="80" />
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button text size="small" type="danger" @click="subscriptions.splice($index, 1)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:12px;display:flex;gap:8px">
          <el-input v-model="newTopic" placeholder="输入 Topic" size="small" />
          <el-button size="small" type="primary" @click="addSub">订阅</el-button>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>遗嘱消息 (LWT)</template>
        <el-form label-width="100px" label-position="left">
          <el-form-item label="启用 LWT">
            <el-switch v-model="lwt.enabled" />
          </el-form-item>
          <el-form-item label="Topic">
            <el-input v-model="lwt.topic" />
          </el-form-item>
          <el-form-item label="消息内容">
            <el-input v-model="lwt.message" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="QoS">
            <el-radio-group v-model="lwt.qos">
              <el-radio :value="0">0</el-radio>
              <el-radio :value="1">1</el-radio>
              <el-radio :value="2">2</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="Retain">
            <el-switch v-model="lwt.retain" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../store'
import { randomInt } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'
import dayjs from 'dayjs'

const store = useAppStore()
const saving = ref(false)
const connected = ref(true)
const msgSent = ref(12450)
const msgRecv = ref(3280)
const reconnects = ref(2)
const lastMsgTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const newTopic = ref('')

const form = reactive({ ...store.mqttConfig })

const subscriptions = ref([
  { topic: 'tinyml/gw01/sensor/#', qos: 1, messages: 8420 },
  { topic: 'tinyml/gw01/alarm/#', qos: 1, messages: 156 },
  { topic: 'tinyml/gw01/cmd', qos: 2, messages: 42 },
  { topic: 'tinyml/gw01/status', qos: 0, messages: 2100 },
])

const lwt = reactive({
  enabled: true,
  topic: 'tinyml/gw01/status',
  message: '{"status":"offline","reason":"unexpected"}',
  qos: 1,
  retain: true,
})

let timer = null
onMounted(() => {
  timer = setInterval(() => {
    if (connected.value) {
      msgSent.value += randomInt(1, 5)
      msgRecv.value += randomInt(0, 2)
      lastMsgTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
      subscriptions.value.forEach(s => { s.messages += randomInt(0, 3) })
    }
  }, 3000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

function handleSave() {
  saving.value = true
  deviceApi.saveMqttConfig({ ...form })
  setTimeout(() => {
    Object.assign(store.mqttConfig, form)
    ElMessage.success('MQTT 配置已保存')
    saving.value = false
  }, 800)
}

function toggleConnect() {
  const target = !connected.value
  deviceApi.mqttConnect({ connected: target, ...form })
  if (connected.value) {
    connected.value = false
    store.mqttConfig.status = 'disconnected'
    ElMessage.warning('MQTT 已断开')
  } else {
    ElMessage.info('正在连接 MQTT Broker...')
    setTimeout(() => {
      connected.value = true
      store.mqttConfig.status = 'connected'
      reconnects.value++
      ElMessage.success('MQTT 连接成功')
    }, 1500)
  }
}

function sendTestMsg() {
  deviceApi.mqttTest({ topic: form.baseTopic + 'test', qos: form.qos, payload: 'test message' })
  ElMessage.success('测试消息已发送至 ' + form.baseTopic + 'test')
  msgSent.value++
}

function addSub() {
  if (!newTopic.value) return
  subscriptions.value.push({ topic: newTopic.value, qos: form.qos, messages: 0 })
  deviceApi.addSubscription({ topic: newTopic.value, qos: form.qos })
  ElMessage.success('已订阅 ' + newTopic.value)
  newTopic.value = ''
}
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
