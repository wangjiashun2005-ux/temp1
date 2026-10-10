<template>
  <div class="page-container dashboard">
    <!-- Stat Cards -->
    <div class="stat-cards">
      <el-card v-for="stat in stats" :key="stat.label" class="stat-card" shadow="never">
        <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
          <el-icon :size="24"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-card>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>实时振动波形</span>
            <el-tag size="small" type="success" effect="dark">采集中</el-tag>
          </div>
        </template>
        <v-chart :option="vibrationOption" autoresize style="height: 280px" />
      </el-card>
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>温度 / 电流监测</span>
            <el-tag size="small" type="warning" effect="dark">实时</el-tag>
          </div>
        </template>
        <v-chart :option="tempCurrentOption" autoresize style="height: 280px" />
      </el-card>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-row">
      <el-card class="alarm-card" shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>最近告警</span>
            <el-button text size="small" type="primary" @click="$router.push('/alarm')">查看全部</el-button>
          </div>
        </template>
        <el-table :data="recentAlarms" size="small" max-height="220">
          <el-table-column prop="timestamp" label="时间" width="160" />
          <el-table-column prop="source" label="来源" width="110" />
          <el-table-column prop="message" label="内容" show-overflow-tooltip />
          <el-table-column prop="level" label="级别" width="80">
            <template #default="{ row }">
              <el-tag :type="row.level === 'danger' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'" size="small" effect="dark">
                {{ row.level === 'danger' ? '严重' : row.level === 'warning' ? '警告' : '信息' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card class="health-card" shadow="never">
        <template #header>设备健康分布</template>
        <v-chart :option="healthOption" autoresize style="height: 220px" />
      </el-card>
    </div>

    <!-- Inference Stats -->
    <div class="inference-row">
      <el-card shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>TinyML 推理统计</span>
            <el-tag size="small" effect="dark">模型: 轴承故障检测 v1.2</el-tag>
          </div>
        </template>
        <div class="inference-stats">
          <div class="inf-item">
            <span class="inf-value">{{ inferenceStats.totalInferences }}</span>
            <span class="inf-label">总推理次数</span>
          </div>
          <div class="inf-item">
            <span class="inf-value" style="color:#2ecc71">{{ inferenceStats.normalCount }}</span>
            <span class="inf-label">正常</span>
          </div>
          <div class="inf-item">
            <span class="inf-value" style="color:#f39c12">{{ inferenceStats.warningCount }}</span>
            <span class="inf-label">预警</span>
          </div>
          <div class="inf-item">
            <span class="inf-value" style="color:#e74c3c">{{ inferenceStats.faultCount }}</span>
            <span class="inf-label">故障</span>
          </div>
          <div class="inf-item">
            <span class="inf-value">{{ inferenceStats.avgLatency }}ms</span>
            <span class="inf-label">平均延迟</span>
          </div>
          <div class="inf-item">
            <span class="inf-value">{{ inferenceStats.accuracy }}%</span>
            <span class="inf-label">准确率</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { useAppStore } from '../../store'
import { randomBetween, randomInt } from '../../utils/mock'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const store = useAppStore()

const vibrationData = reactive({ x: [], y: [], z: [], time: [] })
const tempData = reactive({ temp: [], current: [], time: [] })
const recentAlarms = computed(() => store.alarms.slice(0, 8))

const stats = reactive([
  { label: '在线传感器', value: 6, icon: 'Cpu', color: '#2ecc71' },
  { label: '推理速率 (次/秒)', value: 12, icon: 'MagicStick', color: '#3498db' },
  { label: '今日告警', value: 3, icon: 'Bell', color: '#f39c12' },
  { label: '运行时间', value: '15天8时', icon: 'Timer', color: '#9b59b6' },
])

const inferenceStats = reactive({
  totalInferences: 184520,
  normalCount: 178340,
  warningCount: 5120,
  faultCount: 1060,
  avgLatency: 2.3,
  accuracy: 97.8,
})

function initData() {
  const now = dayjs()
  for (let i = 60; i >= 0; i--) {
    const t = now.subtract(i, 'second').format('HH:mm:ss')
    vibrationData.time.push(t)
    vibrationData.x.push(randomBetween(-3, 3))
    vibrationData.y.push(randomBetween(-3, 3))
    vibrationData.z.push(randomBetween(-5, 5))
    tempData.time.push(t)
    tempData.temp.push(randomBetween(40, 70))
    tempData.current.push(randomBetween(2, 10))
  }
}

function updateData() {
  const t = dayjs().format('HH:mm:ss')
  vibrationData.time.push(t)
  vibrationData.x.push(randomBetween(-3, 3))
  vibrationData.y.push(randomBetween(-3, 3))
  vibrationData.z.push(randomBetween(-5, 5))
  if (vibrationData.time.length > 60) {
    vibrationData.time.shift(); vibrationData.x.shift(); vibrationData.y.shift(); vibrationData.z.shift()
  }
  tempData.time.push(t)
  tempData.temp.push(randomBetween(40, 70))
  tempData.current.push(randomBetween(2, 10))
  if (tempData.time.length > 60) {
    tempData.time.shift(); tempData.temp.shift(); tempData.current.shift()
  }
  stats[0].value = randomInt(5, 8)
  stats[1].value = randomInt(8, 15)
  stats[2].value = randomInt(0, 12)
  inferenceStats.totalInferences += randomInt(5, 20)
  inferenceStats.normalCount += randomInt(4, 18)
  inferenceStats.warningCount += randomInt(0, 2)
  inferenceStats.faultCount += Math.random() > 0.8 ? 1 : 0
  inferenceStats.avgLatency = randomBetween(1.5, 4.0)
  inferenceStats.accuracy = randomBetween(96.5, 99.2)
  if (Math.random() > 0.7) store.addAlarm()
}

const chartTextColor = '#a0a0a0'
const chartLineColors = ['#16c2b0', '#3498db', '#e74c3c']

const vibrationOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['X轴', 'Y轴', 'Z轴'], textStyle: { color: chartTextColor }, top: 0 },
  grid: { left: 50, right: 20, top: 35, bottom: 25 },
  xAxis: { type: 'category', data: vibrationData.time, axisLabel: { color: chartTextColor, fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
  yAxis: { type: 'value', name: 'g', axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
  series: [
    { name: 'X轴', type: 'line', data: vibrationData.x, smooth: true, showSymbol: false, lineStyle: { width: 1.5 }, itemStyle: { color: chartLineColors[0] } },
    { name: 'Y轴', type: 'line', data: vibrationData.y, smooth: true, showSymbol: false, lineStyle: { width: 1.5 }, itemStyle: { color: chartLineColors[1] } },
    { name: 'Z轴', type: 'line', data: vibrationData.z, smooth: true, showSymbol: false, lineStyle: { width: 1.5 }, itemStyle: { color: chartLineColors[2] } },
  ],
  animation: false,
}))

const tempCurrentOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['温度 (°C)', '电流 (A)'], textStyle: { color: chartTextColor }, top: 0 },
  grid: { left: 50, right: 50, top: 35, bottom: 25 },
  xAxis: { type: 'category', data: tempData.time, axisLabel: { color: chartTextColor, fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
  yAxis: [
    { type: 'value', name: '°C', axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    { type: 'value', name: 'A', axisLabel: { color: chartTextColor }, splitLine: { show: false } },
  ],
  series: [
    { name: '温度 (°C)', type: 'line', data: tempData.temp, smooth: true, showSymbol: false, lineStyle: { width: 1.5 }, itemStyle: { color: '#e67e22' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(230,126,34,0.3)' }, { offset: 1, color: 'rgba(230,126,34,0)' }] } } },
    { name: '电流 (A)', type: 'line', yAxisIndex: 1, data: tempData.current, smooth: true, showSymbol: false, lineStyle: { width: 1.5 }, itemStyle: { color: '#3498db' } },
  ],
  animation: false,
}))

const healthOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
    label: { color: chartTextColor, fontSize: 11 },
    data: [
      { value: 5, name: '正常', itemStyle: { color: '#2ecc71' } },
      { value: 1, name: '预警', itemStyle: { color: '#f39c12' } },
      { value: 1, name: '离线', itemStyle: { color: '#636e72' } },
    ]
  }]
}))

let timer = null
onMounted(() => {
  initData()
  timer = setInterval(updateData, 2000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.dashboard { padding: 16px; }
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.stat-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-value { font-size: 24px; font-weight: 700; color: #e0e0e0; }
.stat-label { font-size: 12px; color: #a0a0a0; margin-top: 2px; }
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.bottom-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.card-header-row {
  display: flex; justify-content: space-between; align-items: center;
}
.inference-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  text-align: center;
}
.inf-item { display: flex; flex-direction: column; }
.inf-value { font-size: 22px; font-weight: 700; color: #16c2b0; }
.inf-label { font-size: 12px; color: #a0a0a0; margin-top: 4px; }
</style>
