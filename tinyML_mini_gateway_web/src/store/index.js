import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { generateSensorData, generateAlarmLog, generateModbusDevices, deviceInfo } from '../utils/mock'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const device = reactive({ ...deviceInfo })
  const sensorHistory = ref([])
  const alarms = ref(Array.from({ length: 20 }, () => generateAlarmLog()))
  const modbusDevices = ref(generateModbusDevices())
  const networkConfig = reactive({
    mode: 'static',
    ip: '192.168.1.100',
    subnet: '255.255.255.0',
    gateway: '192.168.1.1',
    dns1: '8.8.8.8',
    dns2: '114.114.114.114',
    hostname: 'tinyml-gw-01',
    macAddress: device.mac,
  })
  const mqttConfig = reactive({
    enabled: true,
    broker: '192.168.1.50',
    port: 1883,
    clientId: 'tinyml-gw-01',
    username: 'gateway',
    password: 'gateway123',
    keepAlive: 60,
    cleanSession: true,
    qos: 1,
    baseTopic: 'tinyml/gw01/',
    useTLS: false,
    status: 'connected',
    lastMessage: new Date().toISOString(),
  })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addSensorData() {
    const data = generateSensorData()
    sensorHistory.value.push(data)
    if (sensorHistory.value.length > 120) {
      sensorHistory.value.shift()
    }
    return data
  }

  function addAlarm() {
    const alarm = generateAlarmLog()
    alarms.value.unshift(alarm)
    if (alarms.value.length > 100) {
      alarms.value.pop()
    }
  }

  return {
    sidebarCollapsed, device, sensorHistory, alarms, modbusDevices,
    networkConfig, mqttConfig,
    toggleSidebar, addSensorData, addAlarm,
  }
})
