<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">以太网数据输出配置</span>
      <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
    </div>

    <div class="card-grid">
      <!-- HTTP JSON Output -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>HTTP JSON 输出</span>
            <el-switch v-model="http.enabled" size="small" />
          </div>
        </template>
        <el-form :model="http" label-width="110px" label-position="left">
          <el-form-item label="启用推送">
            <el-switch v-model="http.enabled" :disabled="true" />
          </el-form-item>
          <el-form-item label="目标 URL">
            <el-input v-model="http.url" placeholder="https://api.example.com/data" />
          </el-form-item>
          <el-form-item label="请求方法">
            <el-select v-model="http.method" style="width:100%">
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="PATCH" value="PATCH" />
            </el-select>
          </el-form-item>
          <el-form-item label="Content-Type">
            <el-select v-model="http.contentType" style="width:100%">
              <el-option label="application/json" value="application/json" />
              <el-option label="text/plain" value="text/plain" />
            </el-select>
          </el-form-item>
          <el-form-item label="推送间隔(ms)">
            <el-input-number v-model="http.interval" :min="100" :max="60000" :step="100" />
          </el-form-item>
          <el-form-item label="超时时间(s)">
            <el-input-number v-model="http.timeout" :min="1" :max="60" />
          </el-form-item>
          <el-form-item label="重试次数">
            <el-input-number v-model="http.retry" :min="0" :max="10" />
          </el-form-item>
          <el-form-item label="启用认证">
            <el-switch v-model="http.auth" />
          </el-form-item>
          <el-form-item label="API Key" v-if="http.auth">
            <el-input v-model="http.apiKey" placeholder="Bearer xxx" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- MQTT Output -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>MQTT 数据输出</span>
            <el-switch v-model="mqttOut.enabled" size="small" />
          </div>
        </template>
        <el-form :model="mqttOut" label-width="110px" label-position="left">
          <el-form-item label="启用推送">
            <el-switch v-model="mqttOut.enabled" :disabled="true" />
          </el-form-item>
          <el-form-item label="基础 Topic">
            <el-input v-model="mqttOut.baseTopic" placeholder="tinyml/gw01/" />
          </el-form-item>
          <el-form-item label="数据 Topic">
            <el-input v-model="mqttOut.dataTopic" placeholder="data/sensor" />
          </el-form-item>
          <el-form-item label="推理结果 Topic">
            <el-input v-model="mqttOut.resultTopic" placeholder="result/inference" />
          </el-form-item>
          <el-form-item label="状态 Topic">
            <el-input v-model="mqttOut.statusTopic" placeholder="status/device" />
          </el-form-item>
          <el-form-item label="发布间隔(ms)">
            <el-input-number v-model="mqttOut.interval" :min="100" :max="60000" :step="100" />
          </el-form-item>
          <el-form-item label="QoS">
            <el-radio-group v-model="mqttOut.qos">
              <el-radio :value="0">QoS 0</el-radio>
              <el-radio :value="1">QoS 1</el-radio>
              <el-radio :value="2">QoS 2</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="Retain">
            <el-switch v-model="mqttOut.retain" />
          </el-form-item>
          <el-form-item label="JSON 格式">
            <el-select v-model="mqttOut.format" style="width:100%">
              <el-option label="紧凑格式" value="compact" />
              <el-option label="可读格式" value="pretty" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Data Mapping -->
      <el-card shadow="never">
        <template #header>输出数据映射</template>
        <el-table :data="dataMapping" size="small">
          <el-table-column prop="source" label="数据源" />
          <el-table-column prop="field" label="输出字段" />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="scale" label="缩放" width="80" />
          <el-table-column label="启用" width="70">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" size="small" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Output Preview -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>输出数据预览</span>
            <el-button text size="small" @click="refreshPreview">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
        </template>
        <pre class="json-preview">{{ jsonPreview }}</pre>
      </el-card>
    </div>

    <!-- Transmission Statistics -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>传输统计</template>
      <div class="trans-stats">
        <div class="trans-item">
          <div class="trans-val" style="color:#2ecc71">{{ stats.success }}</div>
          <div class="trans-label">成功推送</div>
        </div>
        <div class="trans-item">
          <div class="trans-val" style="color:#e74c3c">{{ stats.failed }}</div>
          <div class="trans-label">失败次数</div>
        </div>
        <div class="trans-item">
          <div class="trans-val" style="color:#f39c12">{{ stats.pending }}</div>
          <div class="trans-label">队列中</div>
        </div>
        <div class="trans-item">
          <div class="trans-val" style="color:#3498db">{{ stats.bytesOut }}</div>
          <div class="trans-label">发送字节 (KB)</div>
        </div>
        <div class="trans-item">
          <div class="trans-val">{{ stats.avgLatency }}ms</div>
          <div class="trans-label">平均延迟</div>
        </div>
        <div class="trans-item">
          <div class="trans-val">{{ stats.uptime }}</div>
          <div class="trans-label">持续时间</div>
        </div>
      </div>
      <div style="margin-top:12px;text-align:right">
        <el-button size="small" type="danger" @click="resetStats">重置统计</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { randomBetween, randomInt } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'
import dayjs from 'dayjs'

const saving = ref(false)

const http = reactive({
  enabled: true,
  url: 'https://api.example.com/tinyml/data',
  method: 'POST',
  contentType: 'application/json',
  interval: 5000,
  timeout: 10,
  retry: 3,
  auth: false,
  apiKey: '',
})

const mqttOut = reactive({
  enabled: true,
  baseTopic: 'tinyml/gw01/',
  dataTopic: 'data/sensor',
  resultTopic: 'result/inference',
  statusTopic: 'status/device',
  interval: 2000,
  qos: 1,
  retain: false,
  format: 'compact',
})

const dataMapping = reactive([
  { source: '振动传感器 X', field: 'vibration_x', type: 'float', scale: '1x', enabled: true },
  { source: '振动传感器 Y', field: 'vibration_y', type: 'float', scale: '1x', enabled: true },
  { source: '振动传感器 Z', field: 'vibration_z', type: 'float', scale: '1x', enabled: true },
  { source: '温度传感器', field: 'temperature', type: 'float', scale: '1x', enabled: true },
  { source: '电流互感器', field: 'current', type: 'float', scale: '1x', enabled: true },
  { source: 'TinyML 推理结果', field: 'inference_result', type: 'string', scale: '-', enabled: true },
  { source: 'TinyML 置信度', field: 'confidence', type: 'float', scale: '100%', enabled: true },
  { source: '设备状态', field: 'device_status', type: 'object', scale: '-', enabled: true },
])

const jsonPreview = ref('')
const stats = reactive({
  success: 12450,
  failed: 3,
  pending: 2,
  bytesOut: '2,840',
  avgLatency: '12',
  uptime: '15天8时',
})

function refreshPreview() {
  const data = {
    timestamp: dayjs().toISOString(),
    device_id: 'TMLGW-2024-000001',
    device_status: 'running',
    sensors: {
      vibration: {
        x: randomBetween(-5, 5),
        y: randomBetween(-5, 5),
        z: randomBetween(-8, 8),
      },
      temperature: randomBetween(40, 75),
      current: randomBetween(2, 12),
      humidity: randomBetween(40, 80),
      noise: randomBetween(50, 95),
    },
    inference: {
      model: 'bearing_fault_v1.2',
      result: ['normal', 'wear', 'fault_severe'][randomInt(0, 2)],
      confidence: randomBetween(85, 99.9),
      latency_ms: randomBetween(1.5, 4.5),
    },
    modbus: {
      device_count: 6,
      active_count: randomInt(4, 6),
    },
    system: {
      cpu_usage: randomBetween(15, 65),
      mem_usage: randomBetween(30, 75),
      uptime_seconds: randomInt(100000, 900000),
    },
  }
  jsonPreview.value = JSON.stringify(data, null, 2)
}

function handleSave() {
  saving.value = true
  deviceApi.saveOutputConfig({
    http: { ...http },
    mqtt: { ...mqttOut },
    mapping: dataMapping.map(m => ({ ...m })),
  })
  setTimeout(() => {
    saving.value = false
    ElMessage.success('数据输出配置已保存')
  }, 800)
}

function resetStats() {
  stats.success = 0; stats.failed = 0; stats.pending = 0; stats.bytesOut = '0'
  ElMessage.success('统计已重置')
}

let timer = null
onMounted(() => {
  refreshPreview()
  timer = setInterval(() => {
    if (mqttOut.enabled) { stats.success += randomInt(1, 3) }
    if (http.enabled && Math.random() > 0.95) { stats.success += randomInt(1, 2) }
    stats.failed += Math.random() > 0.98 ? 1 : 0
    stats.pending = randomInt(0, 5)
    refreshPreview()
  }, 5000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.json-preview {
  background: rgba(0,0,0,0.3);
  padding: 16px;
  border-radius: 8px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  color: #2ecc71;
  max-height: 380px;
  overflow: auto;
  white-space: pre;
  line-height: 1.5;
}
.trans-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  text-align: center;
  padding: 12px 0;
}
.trans-item { display: flex; flex-direction: column; }
.trans-val { font-size: 24px; font-weight: 700; color: #16c2b0; }
.trans-label { font-size: 12px; color: #a0a0a0; margin-top: 4px; }
</style>
