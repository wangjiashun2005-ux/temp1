<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">网络设置</span>
      <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
    </div>
    <div class="card-grid">
      <el-card shadow="never">
        <template #header>以太网配置</template>
        <el-form :model="form" label-width="120px" label-position="left">
          <el-form-item label="连接模式">
            <el-radio-group v-model="form.mode">
              <el-radio value="static">静态 IP</el-radio>
              <el-radio value="dhcp">DHCP</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="IP 地址">
            <el-input v-model="form.ip" :disabled="form.mode === 'dhcp'" />
          </el-form-item>
          <el-form-item label="子网掩码">
            <el-input v-model="form.subnet" :disabled="form.mode === 'dhcp'" />
          </el-form-item>
          <el-form-item label="默认网关">
            <el-input v-model="form.gateway" :disabled="form.mode === 'dhcp'" />
          </el-form-item>
          <el-form-item label="DNS 服务器 1">
            <el-input v-model="form.dns1" :disabled="form.mode === 'dhcp'" />
          </el-form-item>
          <el-form-item label="DNS 服务器 2">
            <el-input v-model="form.dns2" :disabled="form.mode === 'dhcp'" />
          </el-form-item>
          <el-form-item label="主机名">
            <el-input v-model="form.hostname" />
          </el-form-item>
          <el-form-item label="MAC 地址">
            <el-input v-model="form.macAddress" disabled />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never">
        <template #header>网络状态</template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="链路状态">
            <el-tag type="success" effect="dark" size="small">已连接 (100Mbps Full Duplex)</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP 地址">{{ form.ip }}</el-descriptions-item>
          <el-descriptions-item label="子网掩码">{{ form.subnet }}</el-descriptions-item>
          <el-descriptions-item label="网关">{{ form.gateway }}</el-descriptions-item>
          <el-descriptions-item label="DNS">{{ form.dns1 }}</el-descriptions-item>
          <el-descriptions-item label="MAC 地址">{{ form.macAddress }}</el-descriptions-item>
          <el-descriptions-item label="RX 流量">{{ rxTraffic }} MB</el-descriptions-item>
          <el-descriptions-item label="TX 流量">{{ txTraffic }} MB</el-descriptions-item>
          <el-descriptions-item label="丢包率">0.02%</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never">
        <template #header>高级设置</template>
        <el-form label-width="120px" label-position="left">
          <el-form-item label="MTU">
            <el-input-number v-model="mtu" :min="576" :max="9000" />
          </el-form-item>
          <el-form-item label="TCP 端口">
            <el-input-number v-model="tcpPort" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="Web 端口">
            <el-input-number v-model="webPort" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="NTP 服务器">
            <el-input v-model="ntpServer" />
          </el-form-item>
          <el-form-item label="时区">
            <el-select v-model="timezone" style="width:100%">
              <el-option label="UTC+8 (中国标准时间)" value="Asia/Shanghai" />
              <el-option label="UTC+9 (日本标准时间)" value="Asia/Tokyo" />
              <el-option label="UTC+0 (格林威治时间)" value="UTC" />
            </el-select>
          </el-form-item>
          <el-form-item label="防火墙">
            <el-switch v-model="firewallEnabled" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never">
        <template #header>网络诊断</template>
        <el-form label-width="80px">
          <el-form-item label="Ping">
            <el-input v-model="pingTarget" placeholder="输入目标地址">
              <template #append>
                <el-button @click="doPing" :loading="pinging">Ping</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        <div v-if="pingResult" class="ping-result">
          <pre>{{ pingResult }}</pre>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../store'
import { randomBetween } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'

const store = useAppStore()
const saving = ref(false)
const form = reactive({ ...store.networkConfig })
const rxTraffic = ref((Math.random() * 500 + 100).toFixed(1))
const txTraffic = ref((Math.random() * 200 + 50).toFixed(1))
const mtu = ref(1500)
const tcpPort = ref(502)
const webPort = ref(80)
const ntpServer = ref('ntp.aliyun.com')
const timezone = ref('Asia/Shanghai')
const firewallEnabled = ref(true)
const pingTarget = ref('192.168.1.1')
const pinging = ref(false)
const pingResult = ref('')

function handleSave() {
  saving.value = true
  deviceApi.saveNetworkConfig({
    ...form,
    mtu: mtu.value,
    tcpPort: tcpPort.value,
    webPort: webPort.value,
    ntpServer: ntpServer.value,
    timezone: timezone.value,
    firewallEnabled: firewallEnabled.value,
  })
  setTimeout(() => {
    Object.assign(store.networkConfig, form)
    ElMessage.success('网络配置已保存，正在应用...')
    saving.value = false
  }, 1000)
}

function doPing() {
  pinging.value = true
  pingResult.value = ''
  deviceApi.ping({ target: pingTarget.value })
  setTimeout(() => {
    const ms = [randomBetween(0.5, 5), randomBetween(0.5, 5), randomBetween(0.5, 5), randomBetween(0.5, 5)]
    pingResult.value = `PING ${pingTarget.value}:\n64 bytes: seq=0 ttl=64 time=${ms[0]} ms\n64 bytes: seq=1 ttl=64 time=${ms[1]} ms\n64 bytes: seq=2 ttl=64 time=${ms[2]} ms\n64 bytes: seq=3 ttl=64 time=${ms[3]} ms\n\n--- ${pingTarget.value} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss\nround-trip min/avg/max = ${Math.min(...ms)}/${(ms.reduce((a,b)=>a+b)/4).toFixed(2)}/${Math.max(...ms)} ms`
    pinging.value = false
  }, 2000)
}
</script>

<style scoped>
.ping-result {
  background: rgba(0,0,0,0.3);
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
}
.ping-result pre {
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: #2ecc71;
  white-space: pre-wrap;
}
</style>
