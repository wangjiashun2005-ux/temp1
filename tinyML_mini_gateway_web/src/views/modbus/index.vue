<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">RS485 Modbus 配置</span>
      <div>
        <el-button @click="scanBus" :loading="scanning">
          <el-icon><Search /></el-icon> 扫描总线
        </el-button>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 添加设备
        </el-button>
      </div>
    </div>

    <!-- Port Config -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>串口参数</template>
      <el-form :inline="true" :model="portConfig">
        <el-form-item label="端口">
          <el-select v-model="portConfig.port" style="width:120px">
            <el-option label="RS485-1" value="rs485_1" />
            <el-option label="RS485-2" value="rs485_2" />
          </el-select>
        </el-form-item>
        <el-form-item label="波特率">
          <el-select v-model="portConfig.baudRate" style="width:120px">
            <el-option v-for="b in [9600,19200,38400,57600,115200]" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据位">
          <el-select v-model="portConfig.dataBits" style="width:80px">
            <el-option :label="7" :value="7" /><el-option :label="8" :value="8" />
          </el-select>
        </el-form-item>
        <el-form-item label="停止位">
          <el-select v-model="portConfig.stopBits" style="width:80px">
            <el-option :label="1" :value="1" /><el-option :label="2" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="校验">
          <el-select v-model="portConfig.parity" style="width:100px">
            <el-option label="None" value="None" />
            <el-option label="Even" value="Even" />
            <el-option label="Odd" value="Odd" />
          </el-select>
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="portConfig.protocol" style="width:120px">
            <el-option label="Modbus RTU" value="rtu" />
            <el-option label="Modbus ASCII" value="ascii" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="savePort">应用</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Device Table -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header-row">
          <span>从站设备列表</span>
          <el-tag effect="dark" size="small">{{ devices.length }} 个设备</el-tag>
        </div>
      </template>
      <el-table :data="devices" stripe>
        <el-table-column prop="address" label="从站地址" width="90" />
        <el-table-column prop="name" label="设备名称" width="180" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="functionCode" label="功能码" width="80">
          <template #default="{ row }">0x{{ row.functionCode.toString(16).padStart(2, '0') }}</template>
        </el-table-column>
        <el-table-column prop="registerStart" label="起始寄存器" width="100" />
        <el-table-column prop="registerCount" label="寄存器数" width="90" />
        <el-table-column prop="pollInterval" label="轮询间隔(ms)" width="110" />
        <el-table-column prop="lastValue" label="最新值" width="90">
          <template #default="{ row }">{{ row.lastValue.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'" size="small" effect="dark">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row, $index }">
            <el-button text size="small" type="primary" @click="editDevice(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="removeDevice($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="showAddDialog" :title="editingDevice ? '编辑设备' : '添加从站设备'" width="500px">
      <el-form :model="deviceForm" label-width="100px">
        <el-form-item label="从站地址"><el-input-number v-model="deviceForm.address" :min="1" :max="247" /></el-form-item>
        <el-form-item label="设备名称"><el-input v-model="deviceForm.name" /></el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="deviceForm.type" style="width:100%">
            <el-option v-for="t in ['振动传感器','温度传感器','电流互感器','压力传感器','噪声传感器','转速传感器']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="功能码">
          <el-select v-model="deviceForm.functionCode" style="width:100%">
            <el-option label="0x03 读保持寄存器" :value="3" />
            <el-option label="0x04 读输入寄存器" :value="4" />
            <el-option label="0x01 读线圈" :value="1" />
            <el-option label="0x02 读离散输入" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始寄存器"><el-input-number v-model="deviceForm.registerStart" :min="0" :max="65535" /></el-form-item>
        <el-form-item label="寄存器数量"><el-input-number v-model="deviceForm.registerCount" :min="1" :max="125" /></el-form-item>
        <el-form-item label="轮询间隔(ms)"><el-input-number v-model="deviceForm.pollInterval" :min="50" :max="60000" :step="100" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDevice">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../store'
import { randomBetween, randomInt } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'

const store = useAppStore()
const devices = ref([...store.modbusDevices])
const scanning = ref(false)
const showAddDialog = ref(false)
const editingDevice = ref(null)

const portConfig = reactive({
  port: 'rs485_1',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'None',
  protocol: 'rtu',
})

const deviceForm = reactive({
  address: 1, name: '', type: '振动传感器', functionCode: 3,
  registerStart: 0, registerCount: 2, pollInterval: 1000,
})

function savePort() {
  deviceApi.saveModbusPort({ ...portConfig })
  ElMessage.success('串口参数已保存')
}

function scanBus() {
  scanning.value = true
  deviceApi.scanModbusBus({ port: portConfig.port, baudRate: portConfig.baudRate, protocol: portConfig.protocol })
  ElMessage.info('正在扫描 RS485 总线...')
  setTimeout(() => {
    const found = randomInt(1, 3)
    ElMessage.success(`扫描完成，发现 ${found} 个新设备`)
    scanning.value = false
  }, 3000)
}

function editDevice(row) {
  editingDevice.value = row
  Object.assign(deviceForm, row)
  showAddDialog.value = true
}

function saveDevice() {
  if (editingDevice.value) {
    Object.assign(editingDevice.value, deviceForm)
    ElMessage.success('设备已更新')
  } else {
    devices.value.push({
      ...deviceForm,
      id: devices.value.length + 1,
      status: 'online',
      lastValue: randomBetween(0, 100),
      baudRate: portConfig.baudRate,
      dataBits: portConfig.dataBits,
      stopBits: portConfig.stopBits,
      parity: portConfig.parity,
    })
    ElMessage.success('设备已添加')
  }
  showAddDialog.value = false
  editingDevice.value = null
  deviceApi.saveModbusDevices({ devices: devices.value })
}

function removeDevice(index) {
  ElMessageBox.confirm('确定删除该设备？', '提示', { type: 'warning' }).then(() => {
    devices.value.splice(index, 1)
    deviceApi.saveModbusDevices({ devices: devices.value })
    ElMessage.success('设备已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
