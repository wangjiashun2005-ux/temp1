<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">系统管理</span>
      <el-button type="danger" @click="rebootDevice">
        <el-icon><RefreshRight /></el-icon> 重启设备
      </el-button>
    </div>

    <div class="card-grid">
      <!-- Resource Monitor -->
      <el-card shadow="never">
        <template #header>资源占用</template>
        <div class="resource-bars">
          <div class="resource-item">
            <div class="resource-label">CPU 使用率</div>
            <el-progress :percentage="cpu" :color="barColor(cpu)" :stroke-width="14" />
          </div>
          <div class="resource-item">
            <div class="resource-label">内存使用率</div>
            <el-progress :percentage="mem" :color="barColor(mem)" :stroke-width="14" />
          </div>
          <div class="resource-item">
            <div class="resource-label">Flash 使用率</div>
            <el-progress :percentage="flash" :color="barColor(flash)" :stroke-width="14" />
          </div>
          <div class="resource-item">
            <div class="resource-label">RAM 占用</div>
            <el-progress :percentage="ramModel" color="#3498db" :stroke-width="14" />
          </div>
          <div class="resource-item">
            <div class="resource-label">设备温度</div>
            <el-progress :percentage="deviceTemp" :color="tempColor" :stroke-width="14" />
          </div>
        </div>
      </el-card>

      <!-- Firmware -->
      <el-card shadow="never">
        <template #header>固件升级</template>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="当前版本">v2.4.1</el-descriptions-item>
          <el-descriptions-item label="最新版本">v2.4.2</el-descriptions-item>
          <el-descriptions-item label="升级状态">
            <el-tag v-if="fwState.idle" type="info" size="small" effect="dark">无升级任务</el-tag>
            <el-tag v-else-if="fwState.downloading" type="warning" size="small" effect="dark">下载中 {{ fwProgress }}%</el-tag>
            <el-tag v-else-if="fwState.installing" type="warning" size="small" effect="dark">安装中...</el-tag>
            <el-tag v-else-if="fwState.done" type="success" size="small" effect="dark">升级完成，待重启</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px">
          <el-upload action="#" :auto-upload="false" accept=".bin" :on-change="handleFwUpload">
            <el-button>
              <el-icon><Upload /></el-icon> 选择固件文件
            </el-button>
          </el-upload>
        </div>
        <el-button type="primary" style="margin-top:12px" @click="startUpgrade" :disabled="fwUpgrading">
          <el-icon><Download /></el-icon> 开始升级
        </el-button>
      </el-card>

      <!-- System Logs -->
      <el-card shadow="never" style="grid-column: 1 / -1">
        <template #header>
          <div class="card-header-row">
            <span>系统日志</span>
            <div>
              <el-radio-group v-model="logLevel" size="small" style="margin-right:8px">
                <el-radio-button value="ALL">全部</el-radio-button>
                <el-radio-button value="INFO">信息</el-radio-button>
                <el-radio-button value="WARN">警告</el-radio-button>
                <el-radio-button value="ERROR">错误</el-radio-button>
              </el-radio-group>
              <el-button size="small" @click="clearLogs">清空日志</el-button>
              <el-button size="small" @click="exportLogs">
                <el-icon><Download /></el-icon> 导出
              </el-button>
            </div>
          </div>
        </template>
        <div class="log-viewer" ref="logViewer">
          <div v-for="(log, i) in filteredLogs" :key="i" class="log-line" :class="'log-' + log.level.toLowerCase()">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-level">{{ log.level }}</span>
            <span class="log-tag">{{ log.tag }}</span>
            <span class="log-msg">{{ log.message }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { randomBetween, randomInt } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'
import dayjs from 'dayjs'

const cpu = ref(42)
const mem = ref(56)
const flash = ref(68)
const ramModel = ref(35)
const deviceTemp = ref(46)
const logLevel = ref('ALL')
const fwUpgrading = ref(false)
const logViewer = ref(null)

const fwState = reactive({ idle: true, downloading: false, installing: false, done: false })
const fwProgress = ref(0)

const logs = reactive([])

const logSources = [
  'SYS', 'NET', 'MQTT', 'MODBUS', 'TinyML', 'SENSOR', 'ALARM', 'HTTP',
]
const logMessages = {
  INFO: ['服务启动成功', '配置变更已应用', '定时任务正常执行', '传感器数据采集正常', 'MQTT 心跳正常', '模型推理完成', '固件检查发现新版本'],
  WARN: ['传感器响应超时', '内存使用接近警告线', 'MQTT 重连延迟升高', '数据集完整性检查警告', '时间同步偏差过大'],
  ERROR: ['Modbus 通信失败: CRC 校验错误', 'MQTT 连接中断', '固件下载失败', '模型加载失败', 'HTTP 推送超时'],
}

function genLog() {
  const r = Math.random()
  const level = r > 0.85 ? 'ERROR' : r > 0.65 ? 'WARN' : 'INFO'
  const levelKey = level === 'ERROR' ? 'ERROR' : level === 'WARN' ? 'WARN' : 'INFO'
  const msgs = logMessages[levelKey]
  return {
    time: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'),
    level,
    tag: logSources[randomInt(0, logSources.length - 1)],
    message: msgs[randomInt(0, msgs.length - 1)],
  }
}

const filteredLogs = computed(() => {
  if (logLevel.value === 'ALL') return logs
  return logs.filter(l => l.level === logLevel.value)
})

function barColor(v) {
  if (v > 85) return '#e74c3c'
  if (v > 70) return '#f39c12'
  return '#2ecc71'
}

const tempColor = computed(() => {
  if (deviceTemp.value > 75) return '#e74c3c'
  if (deviceTemp.value > 60) return '#f39c12'
  return '#3498db'
})

function handleFwUpload() {
  ElMessage.success('固件文件已选择: gateway_v2.4.2.bin (1.8MB)')
}

function startUpgrade() {
  fwUpgrading.value = true
  fwState.idle = false
  fwState.downloading = true
  deviceApi.firmwareUpgrade({ current: 'v2.4.1', target: 'v2.4.2', file: 'gateway_v2.4.2.bin' })
  ElMessage.info('开始下载固件...')
  const t = setInterval(() => {
    fwProgress.value += randomInt(2, 8)
    if (fwProgress.value >= 100) {
      clearInterval(t)
      fwState.downloading = false
      fwState.installing = true
      ElMessage.success('固件下载完成，正在安装...')
      setTimeout(() => {
        fwState.installing = false
        fwState.done = true
        fwUpgrading.value = false
        ElMessage.success('固件安装完成，请重启设备')
      }, 3000)
    }
  }, 300)
}

function rebootDevice() {
  ElMessageBox.confirm('确定重启设备？重启将导致所有连接中断。', '重启确认', { type: 'warning' }).then(() => {
    deviceApi.reboot({ action: 'reboot' })
    ElMessage.loading('设备正在重启...', 3000)
    setTimeout(() => {
      ElMessage.success('设备已重启完成')
    }, 3000)
  }).catch(() => {})
}

function clearLogs() {
  logs.splice(0)
  deviceApi.systemLog({ action: 'clear' })
  ElMessage.success('日志已清空')
}

function exportLogs() {
  deviceApi.systemLog({ action: 'export', count: logs.length })
  ElMessage.success('日志已导出: system_logs_' + dayjs().format('YYYYMMDD') + '.log')
}

let timer = null
onMounted(() => {
  for (let i = 0; i < 30; i++) logs.unshift(genLog())
  timer = setInterval(() => {
    cpu.value = randomInt(15, 80)
    mem.value = randomInt(30, 82)
    flash.value = randomInt(60, 72)
    ramModel.value = randomInt(25, 55)
    deviceTemp.value = randomInt(38, 70)
    logs.unshift(genLog())
    if (logs.length > 500) logs.splice(500)
  }, 2500)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.resource-item { margin-bottom: 16px; }
.resource-label { font-size: 13px; color: #a0a0a0; margin-bottom: 6px; }
.log-viewer {
  background: rgba(0,0,0,0.35);
  border-radius: 6px;
  padding: 12px;
  max-height: 420px;
  overflow-y: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
}
.log-line { white-space: nowrap; }
.log-time { color: #555; margin-right: 8px; }
.log-level { font-weight: bold; margin-right: 8px; display: inline-block; width: 44px; }
.log-info .log-level { color: #3498db; }
.log-warn .log-level { color: #f39c12; }
.log-error .log-level { color: #e74c3c; }
.log-tag { color: #16c2b0; margin-right: 8px; display: inline-block; width: 64px; }
.log-msg { color: #a0a0a0; }
</style>
