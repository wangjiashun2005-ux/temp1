import dayjs from 'dayjs'

export function randomBetween(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomIP() {
  return `192.168.${randomInt(0,255)}.${randomInt(1,254)}`
}

export function randomMAC() {
  return Array.from({length: 6}, () => randomInt(0,255).toString(16).padStart(2,'0')).join(':')
}

export function generateSensorData() {
  return {
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    vibrationX: randomBetween(-5, 5),
    vibrationY: randomBetween(-5, 5),
    vibrationZ: randomBetween(-8, 8),
    temperature: randomBetween(20, 85),
    humidity: randomBetween(30, 90),
    current: randomBetween(0.1, 15),
    voltage: randomBetween(210, 240),
    rpm: randomInt(0, 3600),
    pressure: randomBetween(0, 10),
    noise: randomBetween(40, 100),
  }
}

export function generateTimeSeriesData(points = 60) {
  const data = []
  const now = dayjs()
  for (let i = points; i >= 0; i--) {
    data.push({
      time: now.subtract(i, 'second').format('HH:mm:ss'),
      vibration: randomBetween(0, 8),
      temperature: randomBetween(35, 75),
      current: randomBetween(1, 12),
    })
  }
  return data
}

export function generateAlarmLog() {
  const levels = ['warning', 'danger', 'info']
  const messages = [
    '传感器 #03 振动值超过阈值 (7.2g)',
    '设备温度异常升高至 82°C',
    '通信超时: Modbus 从站地址 0x05 无响应',
    'TinyML 模型推理异常检测触发',
    '电流波动超出正常范围 (14.8A)',
    '传感器 #01 数据帧校验失败',
    '设备运行时间超过维护周期',
    'MQTT 连接断开，正在重连...',
    '噪声水平异常: 98dB',
    '轴承磨损预警 - 频谱特征异常',
  ]
  return {
    id: randomInt(10000, 99999),
    level: levels[randomInt(0, 2)],
    message: messages[randomInt(0, messages.length - 1)],
    source: `传感器 #${randomInt(1, 8).toString().padStart(2, '0')}`,
    timestamp: dayjs().subtract(randomInt(0, 3600), 'second').format('YYYY-MM-DD HH:mm:ss'),
    acknowledged: Math.random() > 0.5,
  }
}

export function generateModbusDevices() {
  const types = ['振动传感器', '温度传感器', '电流互感器', '压力传感器', '噪声传感器', '转速传感器']
  return Array.from({ length: randomInt(4, 8) }, (_, i) => ({
    id: i + 1,
    address: i + 1,
    name: `${types[i % types.length]} #${(i + 1).toString().padStart(2, '0')}`,
    type: types[i % types.length],
    baudRate: [9600, 19200, 38400, 115200][randomInt(0, 3)],
    dataBits: 8,
    stopBits: 1,
    parity: 'None',
    pollInterval: randomInt(100, 2000),
    status: Math.random() > 0.15 ? 'online' : 'offline',
    lastValue: randomBetween(0, 100),
    registerStart: randomInt(0, 100),
    registerCount: randomInt(1, 10),
    functionCode: [3, 4][randomInt(0, 1)],
  }))
}

export const deviceInfo = {
  model: 'TinyML-GW-200E',
  serial: 'TMLGW-2024-' + randomInt(100000, 999999),
  firmware: 'v2.4.1',
  hardware: 'Rev C',
  mac: randomMAC(),
  uptime: `${randomInt(1,90)}天 ${randomInt(0,23)}小时 ${randomInt(0,59)}分钟`,
  cpuUsage: randomBetween(15, 65),
  memUsage: randomBetween(30, 75),
  flashUsage: randomBetween(40, 85),
  temperature: randomBetween(35, 55),
  rs485Ports: 2,
  ethPorts: 1,
  modelSlots: 4,
  maxSensors: 16,
}
