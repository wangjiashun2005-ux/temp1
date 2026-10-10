// 设备层（Java 后端）通信封装
// 所有请求都发往 /api，由 Vite 开发服务器代理到 http://localhost:8090
const BASE = '/api'

async function send(path, payload) {
  try {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } catch (e) {
    console.warn('[设备层] 数据发送失败 ' + path + ' :', e.message)
    return null
  }
}

export const deviceApi = {
  saveNetworkConfig: (d) => send('/device/network/config', d),
  ping: (d) => send('/device/network/ping', d),

  saveModbusPort: (d) => send('/device/modbus/port', d),
  scanModbusBus: (d) => send('/device/modbus/scan', d),
  saveModbusDevices: (d) => send('/device/modbus/devices', d),

  saveSensorConfig: (d) => send('/device/sensor/config', d),

  startTraining: (d) => send('/device/model/train', d),
  uploadModel: (d) => send('/device/model/upload', d),
  modelAction: (d) => send('/device/model/action', d),

  saveAlarmRules: (d) => send('/device/alarm/rules', d),
  saveAlarmNotify: (d) => send('/device/alarm/notify', d),
  clearAlarms: (d) => send('/device/alarm/clear', d),

  saveMqttConfig: (d) => send('/device/mqtt/config', d),
  mqttConnect: (d) => send('/device/mqtt/connect', d),
  mqttTest: (d) => send('/device/mqtt/test', d),
  addSubscription: (d) => send('/device/mqtt/subscription', d),

  saveOutputConfig: (d) => send('/device/output/config', d),

  firmwareUpgrade: (d) => send('/device/system/firmware', d),
  reboot: (d) => send('/device/system/reboot', d),
  systemLog: (d) => send('/device/system/logs', d),
}

// 探测设备层是否在线
export async function pingDeviceLayer() {
  try {
    const res = await fetch(BASE + '/health')
    if (!res.ok) return false
    const data = await res.json()
    return data?.status === 'UP'
  } catch {
    return false
  }
}
