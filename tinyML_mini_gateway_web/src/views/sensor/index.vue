<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">传感器配置</span>
      <el-button type="primary" @click="saveAll">
        <el-icon><Check /></el-icon> 保存所有配置
      </el-button>
    </div>

    <!-- Active Sensors -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div class="card-header-row">
          <span>活跃传感器列表</span>
          <el-button text size="small" type="primary" @click="showAddSensor = true">
            <el-icon><Plus /></el-icon> 添加传感器
          </el-button>
        </div>
      </template>
      <el-table :data="sensors" size="small" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column prop="type" label="类型" width="110" />
        <el-table-column prop="modbusAddr" label="Modbus地址" width="100" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="minRange" label="量程下限" width="80" />
        <el-table-column prop="maxRange" label="量程上限" width="80" />
        <el-table-column prop="interval" label="采样间隔(ms)" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small" effect="dark">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastValue" label="最新值" width="80">
          <template #default="{ row }">{{ row.lastValue }}</template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row, $index }">
            <el-button text size="small" @click="editSensor(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="removeSensor($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="card-grid">
      <!-- Data Frame Format -->
      <el-card shadow="never">
        <template #header>数据帧格式配置</template>
        <el-form label-width="120px" label-position="left">
          <el-form-item label="帧头">
            <el-input v-model="frameConfig.header" placeholder="例: 0xAA 0x55" />
          </el-form-item>
          <el-form-item label="帧头长度">
            <el-input-number v-model="frameConfig.headerLen" :min="1" :max="8" />
          </el-form-item>
          <el-form-item label="设备地址">
            <el-input v-model="frameConfig.deviceAddr" placeholder="例: 0x01" />
          </el-form-item>
          <el-form-item label="功能码">
            <el-input v-model="frameConfig.funcCode" placeholder="例: 0x03" />
          </el-form-item>
          <el-form-item label="数据长度">
            <el-input-number v-model="frameConfig.dataLen" :min="1" :max="256" />
          </el-form-item>
          <el-form-item label="CRC 校验">
            <el-select v-model="frameConfig.crc" style="width:100%">
              <el-option label="CRC-16/Modbus" value="crc16_modbus" />
              <el-option label="CRC-16/CCITT" value="crc16_ccitt" />
              <el-option label="CRC-32" value="crc32" />
              <el-option label="无校验" value="none" />
            </el-select>
          </el-form-item>
          <el-form-item label="帧尾">
            <el-input v-model="frameConfig.footer" placeholder="例: 0x0D 0x0A (可选)" />
          </el-form-item>
          <el-form-item label="字节序">
            <el-radio-group v-model="frameConfig.byteOrder">
              <el-radio value="big">大端 (Big-Endian)</el-radio>
              <el-radio value="little">小端 (Little-Endian)</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveFrame">保存帧配置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Data Preview -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>数据帧预览</span>
            <el-button text size="small" @click="refreshPreview">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
        </template>
        <div class="frame-preview">
          <div class="frame-hex">
            <div v-for="(byte, i) in previewFrame" :key="i" class="hex-byte" :class="byteClass(i)">
              {{ byte }}
            </div>
          </div>
          <div class="frame-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#0f9b8e"></span>帧头</span>
            <span class="legend-item"><span class="legend-dot" style="background:#3498db"></span>地址</span>
            <span class="legend-item"><span class="legend-dot" style="background:#f39c12"></span>功能码</span>
            <span class="legend-item"><span class="legend-dot" style="background:#2ecc71"></span>数据</span>
            <span class="legend-item"><span class="legend-dot" style="background:#e74c3c"></span>CRC</span>
          </div>
        </div>
        <el-divider />
        <div class="frame-structure">
          <h4>帧结构说明</h4>
          <pre>帧头({{ frameConfig.headerLen }}B) | 地址(1B) | 功能码(1B) | 数据长度(1B) | 数据({{ frameConfig.dataLen }}B) | CRC(2B)</pre>
        </div>
        <el-divider />
        <div class="frame-structure">
          <h4>原始数据模拟</h4>
          <el-table :data="simData" size="small" max-height="200">
            <el-table-column prop="sensor" label="传感器" />
            <el-table-column prop="raw" label="原始值" />
            <el-table-column prop="physical" label="物理值" />
            <el-table-column prop="timestamp" label="时间" />
          </el-table>
        </div>
      </el-card>

      <!-- Signal Processing -->
      <el-card shadow="never">
        <template #header>信号处理配置</template>
        <el-form label-width="120px" label-position="left">
          <el-form-item label="采样频率(Hz)">
            <el-input-number v-model="signalConfig.sampleRate" :min="1" :max="50000" :step="100" />
          </el-form-item>
          <el-form-item label="滤波器">
            <el-select v-model="signalConfig.filter" style="width:100%">
              <el-option label="无滤波" value="none" />
              <el-option label="低通滤波" value="lowpass" />
              <el-option label="高通滤波" value="highpass" />
              <el-option label="带通滤波" value="bandpass" />
              <el-option label="中值滤波" value="median" />
            </el-select>
          </el-form-item>
          <el-form-item label="截止频率(Hz)" v-if="signalConfig.filter !== 'none' && signalConfig.filter !== 'median'">
            <el-input-number v-model="signalConfig.cutoffFreq" :min="1" :max="25000" :step="10" />
          </el-form-item>
          <el-form-item label="滤波阶数" v-if="signalConfig.filter !== 'none'">
            <el-input-number v-model="signalConfig.filterOrder" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="降采样">
            <el-switch v-model="signalConfig.downsample" />
          </el-form-item>
          <el-form-item label="降采样倍数" v-if="signalConfig.downsample">
            <el-input-number v-model="signalConfig.downsampleFactor" :min="2" :max="100" />
          </el-form-item>
          <el-form-item label="归一化">
            <el-switch v-model="signalConfig.normalize" />
          </el-form-item>
          <el-form-item label="滑动窗口">
            <el-input-number v-model="signalConfig.windowSize" :min="16" :max="1024" :step="16" />
          </el-form-item>
          <el-form-item label="重叠率(%)">
            <el-input-number v-model="signalConfig.overlap" :min="0" :max="90" :step="10" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSignal">保存信号处理设置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Sensor Statistics -->
      <el-card shadow="never">
        <template #header>传感器运行统计</template>
        <el-table :data="sensors.filter(s => s.enabled)" size="small" max-height="380">
          <el-table-column prop="name" label="传感器" width="160" />
          <el-table-column label="有效率" width="80">
            <template #default="{ row }">{{ (row.validRate || 99.5).toFixed(1) }}%</template>
          </el-table-column>
          <el-table-column label="丢包" width="60">
            <template #default="{ row }">{{ row.lostPackets || 0 }}</template>
          </el-table-column>
          <el-table-column label="CRC错误" width="70">
            <template #default="{ row }">{{ row.crcErrors || 0 }}</template>
          </el-table-column>
          <el-table-column label="平均延迟" width="80">
            <template #default="{ row }">{{ (row.avgLatency || 0.5).toFixed(2) }}ms</template>
          </el-table-column>
          <el-table-column label="数据量">
            <template #default="{ row }">{{ (row.dataPoints || 0).toLocaleString() }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Add Sensor Dialog -->
    <el-dialog v-model="showAddSensor" title="添加传感器" width="500px">
      <el-form :model="sensorForm" label-width="110px">
        <el-form-item label="传感器名称"><el-input v-model="sensorForm.name" /></el-form-item>
        <el-form-item label="传感器类型">
          <el-select v-model="sensorForm.type" style="width:100%">
            <el-option v-for="t in ['振动加速度计','温度热电偶','电流互感器','压力变送器','噪声麦克风','转速编码器','位移传感器','湿度传感器']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="Modbus地址"><el-input-number v-model="sensorForm.modbusAddr" :min="1" :max="247" /></el-form-item>
        <el-form-item label="物理单位"><el-input v-model="sensorForm.unit" placeholder="例: g, °C, A, Pa" /></el-form-item>
        <el-form-item label="量程下限"><el-input-number v-model="sensorForm.minRange" /></el-form-item>
        <el-form-item label="量程上限"><el-input-number v-model="sensorForm.maxRange" /></el-form-item>
        <el-form-item label="采样间隔(ms)"><el-input-number v-model="sensorForm.interval" :min="10" :max="60000" :step="10" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSensor = false">取消</el-button>
        <el-button type="primary" @click="addSensor">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../store'
import { randomBetween, randomInt } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'
import dayjs from 'dayjs'

const store = useAppStore()
const showAddSensor = ref(false)

const sensors = reactive([
  { id: 1, name: '振动传感器 #01', type: '振动加速度计', modbusAddr: 1, unit: 'g', minRange: -10, maxRange: 10, interval: 100, enabled: true, lastValue: '2.34', validRate: 99.8, lostPackets: 12, crcErrors: 0, avgLatency: 0.42, dataPoints: 245600 },
  { id: 2, name: '振动传感器 #02', type: '振动加速度计', modbusAddr: 2, unit: 'g', minRange: -10, maxRange: 10, interval: 100, enabled: true, lastValue: '1.87', validRate: 99.9, lostPackets: 5, crcErrors: 0, avgLatency: 0.38, dataPoints: 245600 },
  { id: 3, name: '温度传感器 #01', type: '温度热电偶', modbusAddr: 3, unit: '°C', minRange: -40, maxRange: 200, interval: 500, enabled: true, lastValue: '56.2', validRate: 99.5, lostPackets: 28, crcErrors: 1, avgLatency: 0.65, dataPoints: 49120 },
  { id: 4, name: '电流互感器 #01', type: '电流互感器', modbusAddr: 4, unit: 'A', minRange: 0, maxRange: 20, interval: 200, enabled: true, lastValue: '8.45', validRate: 99.7, lostPackets: 18, crcErrors: 0, avgLatency: 0.55, dataPoints: 122800 },
  { id: 5, name: '噪声传感器 #01', type: '噪声麦克风', modbusAddr: 5, unit: 'dB', minRange: 0, maxRange: 120, interval: 100, enabled: true, lastValue: '72.3', validRate: 98.9, lostPackets: 65, crcErrors: 3, avgLatency: 0.72, dataPoints: 245600 },
  { id: 6, name: '转速传感器 #01', type: '转速编码器', modbusAddr: 6, unit: 'RPM', minRange: 0, maxRange: 5000, interval: 200, enabled: false, lastValue: '--', validRate: 0, lostPackets: 0, crcErrors: 0, avgLatency: 0, dataPoints: 0 },
])

const frameConfig = reactive({
  header: '0xAA 0x55', headerLen: 2, deviceAddr: '0x01', funcCode: '0x03',
  dataLen: 8, crc: 'crc16_modbus', footer: '', byteOrder: 'little',
})

const signalConfig = reactive({
  sampleRate: 1000, filter: 'lowpass', cutoffFreq: 200, filterOrder: 4,
  downsample: false, downsampleFactor: 4, normalize: true, windowSize: 256, overlap: 50,
})

const previewFrame = ref([])
const simData = reactive([])

const sensorForm = reactive({
  name: '', type: '振动加速度计', modbusAddr: 7, unit: 'g', minRange: -10, maxRange: 10, interval: 100,
})

function refreshPreview() {
  const frame = [...frameConfig.header.split(' '), frameConfig.deviceAddr.split(' ')[0], frameConfig.funcCode.split(' ')[0], '0x08']
  for (let i = 0; i < frameConfig.dataLen; i++) frame.push('0x' + randomInt(0, 255).toString(16).padStart(2, '0').toUpperCase())
  frame.push('0x' + randomInt(0, 255).toString(16).padStart(2, '0').toUpperCase())
  frame.push('0x' + randomInt(0, 255).toString(16).padStart(2, '0').toUpperCase())
  previewFrame.value = frame
  simData.splice(0)
  sensors.filter(s => s.enabled).forEach(s => {
    simData.push({ sensor: s.name, raw: '0x' + randomInt(0, 65535).toString(16).toUpperCase().padStart(4, '0'), physical: `${(randomBetween(parseFloat(s.minRange), parseFloat(s.maxRange))).toFixed(2)} ${s.unit}`, timestamp: dayjs().format('HH:mm:ss.SSS') })
  })
}

function byteClass(i) {
  const hLen = frameConfig.headerLen
  if (i < hLen) return 'header'
  if (i === hLen) return 'addr'
  if (i === hLen + 1) return 'func'
  if (i >= hLen + 4 && i < previewFrame.value.length - 2) return 'data'
  return 'crc'
}

function saveFrame() {
  deviceApi.saveSensorConfig({ frameConfig: { ...frameConfig } })
  ElMessage.success('帧格式配置已保存')
}
function saveSignal() {
  deviceApi.saveSensorConfig({ signalConfig: { ...signalConfig } })
  ElMessage.success('信号处理设置已保存')
}
function saveAll() {
  deviceApi.saveSensorConfig({
    sensors: sensors.map(s => ({ ...s })),
    frameConfig: { ...frameConfig },
    signalConfig: { ...signalConfig },
  })
  ElMessage.success('所有传感器配置已保存')
}

function addSensor() {
  sensors.push({ id: sensors.length + 1, ...sensorForm, enabled: true, lastValue: '--', validRate: 100, lostPackets: 0, crcErrors: 0, avgLatency: 0, dataPoints: 0 })
  showAddSensor.value = false
  deviceApi.saveSensorConfig({ sensors: sensors.map(s => ({ ...s })) })
  ElMessage.success('传感器已添加')
}

function removeSensor(index) {
  sensors.splice(index, 1)
  deviceApi.saveSensorConfig({ sensors: sensors.map(s => ({ ...s })) })
  ElMessage.success('传感器已删除')
}

function editSensor(row) { ElMessage.info(`编辑传感器: ${row.name}`) }

let timer = null
onMounted(() => {
  refreshPreview()
  timer = setInterval(() => {
    sensors.filter(s => s.enabled).forEach(s => {
      s.lastValue = randomBetween(parseFloat(s.minRange), parseFloat(s.maxRange)).toFixed(2)
      s.dataPoints += randomInt(1, 5)
    })
  }, 3000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.frame-preview { padding: 8px 0; }
.frame-hex { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.hex-byte {
  padding: 4px 8px; border-radius: 4px; font-family: Consolas, monospace; font-size: 11px;
  background: rgba(255,255,255,0.05);
}
.hex-byte.header { background: rgba(15,155,142,0.2); color: #0f9b8e; }
.hex-byte.addr { background: rgba(52,152,219,0.2); color: #3498db; }
.hex-byte.func { background: rgba(243,156,18,0.2); color: #f39c12; }
.hex-byte.data { background: rgba(46,204,113,0.2); color: #2ecc71; }
.hex-byte.crc { background: rgba(231,76,60,0.2); color: #e74c3c; }
.frame-legend { display: flex; gap: 16px; font-size: 12px; color: #a0a0a0; }
.legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
.frame-structure pre { font-size: 12px; color: #a0a0a0; font-family: Consolas, monospace; }
.frame-structure h4 { font-size: 13px; margin-bottom: 8px; color: #e0e0e0; }
</style>