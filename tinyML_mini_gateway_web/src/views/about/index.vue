<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">关于设备</span>
    </div>

    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>设备信息</template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="设备型号">{{ device.model }}</el-descriptions-item>
        <el-descriptions-item label="序列号">{{ device.serial }}</el-descriptions-item>
        <el-descriptions-item label="固件版本">{{ device.firmware }}</el-descriptions-item>
        <el-descriptions-item label="硬件版本">{{ device.hardware }}</el-descriptions-item>
        <el-descriptions-item label="MAC 地址">{{ device.mac }}</el-descriptions-item>
        <el-descriptions-item label="运行时间">{{ device.uptime }}</el-descriptions-item>
        <el-descriptions-item label="CPU 使用率">{{ device.cpuUsage }}%</el-descriptions-item>
        <el-descriptions-item label="内存使用率">{{ device.memUsage }}%</el-descriptions-item>
        <el-descriptions-item label="设备温度">{{ device.temperature }}°C</el-descriptions-item>
        <el-descriptions-item label="RS485 端口数">{{ device.rs485Ports }}</el-descriptions-item>
        <el-descriptions-item label="以太网端口数">{{ device.ethPorts }}</el-descriptions-item>
        <el-descriptions-item label="模型槽位数">{{ device.modelSlots }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="card-grid">
      <el-card shadow="never">
        <template #header>应用许可</template>
        <div class="license-info">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="许可证类型">标准版 (永久授权)</el-descriptions-item>
            <el-descriptions-item label="授权设备数">1 台</el-descriptions-item>
            <el-descriptions-item label="最大传感器数">16 路</el-descriptions-item>
            <el-descriptions-item label="TinyML 模型数">4 槽位</el-descriptions-item>
            <el-descriptions-item label="授权期限">长期有效</el-descriptions-item>
            <el-descriptions-item label="技术支持">邮件 / 远程协助</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>关于本系统</template>
        <div class="about-content">
          <div class="about-icon">
            <el-icon :size="56" color="#0f9b8e"><Cpu /></el-icon>
          </div>
          <h3>TinyML Mini Gateway</h3>
          <p class="about-desc">
            面向工业设备状态监测的智能边缘网关。通过 RS485 总线连接各类传感器，
            内置 TinyML 深度学习模型，实现设备状态的实时非接触式监测与异常预警。
          </p>
          <el-divider />
          <div class="about-meta">
            <p>Web 管理界面版本: v2.4.1</p>
            <p>内核: TinyML Runtime v1.8.2</p>
            <p>技术支持: support@tinyml-gateway.com</p>
            <p>官方网站: www.tinyml-gateway.com</p>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>开源组件</template>
        <el-table :data="openSource" size="small">
          <el-table-column prop="name" label="组件" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column prop="license" label="许可证" width="120" />
          <el-table-column prop="desc" label="用途" />
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>周边外设</template>
        <el-table :data="peripherals" size="small">
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '正常' ? 'success' : row.status === '警告' ? 'warning' : 'danger'" size="small" effect="dark">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useAppStore } from '../../store'

const store = useAppStore()
const device = store.device

const openSource = reactive([
  { name: 'Vue.js', version: '3.4.x', license: 'MIT', desc: '前端框架' },
  { name: 'Element Plus', version: '2.7.x', license: 'MIT', desc: 'UI 组件库' },
  { name: 'Apache ECharts', version: '5.5.x', license: 'Apache-2.0', desc: '图表库' },
  { name: 'Pinia', version: '2.1.x', license: 'MIT', desc: '状态管理' },
  { name: 'Vue Router', version: '4.3.x', license: 'MIT', desc: '路由管理' },
])

const peripherals = reactive([
  { type: 'RS485 接口', name: 'A 端口 (D+ / D-)', status: '正常' },
  { type: 'RS485 接口', name: 'B 端口 (A+ / B-)', status: '正常' },
  { type: '以太网接口', name: 'RJ45 100Mbps', status: '正常' },
  { type: 'MicroSD 卡', name: '32GB 存储卡', status: '正常' },
  { type: 'RTC 时钟', name: '实时时钟模块', status: '正常' },
  { type: '蜂鸣器', name: '告警蜂鸣器', status: '警告' },
  { type: 'LED 指示', name: '状态指示灯 (PWR/LINK/TX/RX)', status: '正常' },
])
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.about-content { text-align: center; padding: 16px 0; }
.about-icon { margin-bottom: 12px; }
.about-content h3 { font-size: 20px; color: #e0e0e0; margin-bottom: 12px; }
.about-desc { color: #a0a0a0; font-size: 13px; line-height: 1.8; padding: 0 24px; }
.about-meta p { color: #888; font-size: 12px; line-height: 2; }
</style>
