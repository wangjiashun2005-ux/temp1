<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">告警管理</span>
      <div>
        <el-button @click="clearAll">清除所有</el-button>
        <el-button type="primary" @click="showRuleDialog = true">
          <el-icon><Plus /></el-icon> 添加规则
        </el-button>
      </div>
    </div>

    <!-- Alarm Rules -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div class="card-header-row">
          <span>告警规则</span>
          <el-tag effect="dark" size="small">{{ rules.length }} 条规则</el-tag>
        </div>
      </template>
      <el-table :data="rules" size="small">
        <el-table-column prop="name" label="规则名称" width="180" />
        <el-table-column prop="sensor" label="关联传感器" width="140" />
        <el-table-column prop="condition" label="触发条件" width="200" />
        <el-table-column prop="level" label="告警级别" width="100">
          <template #default="{ row }">
            <el-tag :type="row.level === 'danger' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'" size="small" effect="dark">
              {{ row.level === 'danger' ? '严重' : row.level === 'warning' ? '警告' : '信息' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="160" />
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ $index }">
            <el-button text size="small" type="danger" @click="rules.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Notification Config -->
    <div class="card-grid">
      <el-card shadow="never">
        <template #header>通知方式</template>
        <el-form label-width="120px" label-position="left">
          <el-form-item label="MQTT 推送">
            <el-switch v-model="notify.mqtt" />
          </el-form-item>
          <el-form-item label="HTTP Webhook">
            <el-switch v-model="notify.webhook" />
          </el-form-item>
          <el-form-item label="Webhook URL" v-if="notify.webhook">
            <el-input v-model="notify.webhookUrl" placeholder="https://example.com/webhook" />
          </el-form-item>
          <el-form-item label="蜂鸣器">
            <el-switch v-model="notify.buzzer" />
          </el-form-item>
          <el-form-item label="LED 指示灯">
            <el-switch v-model="notify.led" />
          </el-form-item>
          <el-form-item label="告警抑制(秒)">
            <el-input-number v-model="notify.suppressDuration" :min="0" :max="3600" :step="10" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveNotify">保存通知设置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never">
        <template #header>告警统计</template>
        <div class="alarm-stats">
          <div class="alarm-stat-item">
            <div class="alarm-stat-val" style="color:#e74c3c">{{ alarmCounts.danger }}</div>
            <div class="alarm-stat-label">严重</div>
          </div>
          <div class="alarm-stat-item">
            <div class="alarm-stat-val" style="color:#f39c12">{{ alarmCounts.warning }}</div>
            <div class="alarm-stat-label">警告</div>
          </div>
          <div class="alarm-stat-item">
            <div class="alarm-stat-val" style="color:#3498db">{{ alarmCounts.info }}</div>
            <div class="alarm-stat-label">信息</div>
          </div>
          <div class="alarm-stat-item">
            <div class="alarm-stat-val" style="color:#2ecc71">{{ acknowledgedCount }}</div>
            <div class="alarm-stat-label">已确认</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Alarm History -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div class="card-header-row">
          <span>告警历史</span>
          <el-radio-group v-model="filterLevel" size="small">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="danger">严重</el-radio-button>
            <el-radio-button value="warning">警告</el-radio-button>
            <el-radio-button value="info">信息</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="filteredAlarms" max-height="350" size="small">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="timestamp" label="时间" width="160" />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="message" label="内容" show-overflow-tooltip />
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.level === 'danger' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'" size="small" effect="dark">
              {{ row.level === 'danger' ? '严重' : row.level === 'warning' ? '警告' : '信息' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.acknowledged ? 'success' : 'info'" size="small">
              {{ row.acknowledged ? '已确认' : '未确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="row.acknowledged = true" :disabled="row.acknowledged">确认</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add Rule Dialog -->
    <el-dialog v-model="showRuleDialog" title="添加告警规则" width="520px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称"><el-input v-model="ruleForm.name" /></el-form-item>
        <el-form-item label="关联传感器">
          <el-select v-model="ruleForm.sensor" style="width:100%">
            <el-option v-for="s in ['振动传感器 #01','温度传感器 #02','电流互感器 #03','压力传感器 #04']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数">
          <el-select v-model="ruleForm.param" style="width:100%">
            <el-option v-for="p in ['振动值','温度','电流','压力','噪声','转速']" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件">
          <div style="display:flex;gap:8px">
            <el-select v-model="ruleForm.op" style="width:100px">
              <el-option label=">" value=">" /><el-option label=">=" value=">=" />
              <el-option label="<" value="<" /><el-option label="<=" value="<=" />
            </el-select>
            <el-input-number v-model="ruleForm.threshold" />
          </div>
        </el-form-item>
        <el-form-item label="告警级别">
          <el-radio-group v-model="ruleForm.level">
            <el-radio value="info">信息</el-radio>
            <el-radio value="warning">警告</el-radio>
            <el-radio value="danger">严重</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="动作">
          <el-checkbox-group v-model="ruleForm.actions">
            <el-checkbox value="mqtt" label="MQTT推送" />
            <el-checkbox value="buzzer" label="蜂鸣器" />
            <el-checkbox value="led" label="LED" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="addRule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../store'
import { deviceApi } from '../../utils/deviceApi'

const store = useAppStore()
const showRuleDialog = ref(false)
const filterLevel = ref('')

const rules = ref([
  { name: '振动超限', sensor: '振动传感器 #01', condition: '振动值 > 6.0g', level: 'danger', action: 'MQTT + 蜂鸣器', enabled: true },
  { name: '温度过高', sensor: '温度传感器 #02', condition: '温度 > 80°C', level: 'warning', action: 'MQTT推送', enabled: true },
  { name: '电流异常', sensor: '电流互感器 #03', condition: '电流 > 14A', level: 'danger', action: 'MQTT + LED', enabled: true },
  { name: '通信超时', sensor: '全部', condition: '超时 > 5s', level: 'warning', action: 'MQTT推送', enabled: true },
  { name: '模型异常检测', sensor: 'TinyML 推理', condition: '异常分数 > 0.85', level: 'danger', action: 'MQTT + 蜂鸣器 + LED', enabled: true },
])

const notify = reactive({
  mqtt: true, webhook: false, webhookUrl: '', buzzer: true, led: true, suppressDuration: 30,
})

const ruleForm = reactive({
  name: '', sensor: '', param: '振动值', op: '>', threshold: 5.0, level: 'warning', actions: ['mqtt'],
})

const filteredAlarms = computed(() => {
  if (!filterLevel.value) return store.alarms
  return store.alarms.filter(a => a.level === filterLevel.value)
})

const alarmCounts = computed(() => ({
  danger: store.alarms.filter(a => a.level === 'danger').length,
  warning: store.alarms.filter(a => a.level === 'warning').length,
  info: store.alarms.filter(a => a.level === 'info').length,
}))

const acknowledgedCount = computed(() => store.alarms.filter(a => a.acknowledged).length)

function addRule() {
  rules.value.push({
    name: ruleForm.name,
    sensor: ruleForm.sensor,
    condition: `${ruleForm.param} ${ruleForm.op} ${ruleForm.threshold}`,
    level: ruleForm.level,
    action: ruleForm.actions.join(' + '),
    enabled: true,
  })
  showRuleDialog.value = false
  deviceApi.saveAlarmRules({ rules: rules.value })
  ElMessage.success('告警规则已添加')
}

function clearAll() {
  ElMessageBox.confirm('确定清除所有告警记录？', '提示', { type: 'warning' }).then(() => {
    store.alarms.splice(0)
    deviceApi.clearAlarms({})
    ElMessage.success('告警记录已清除')
  }).catch(() => {})
}

function saveNotify() {
  deviceApi.saveAlarmNotify({ ...notify })
  ElMessage.success('通知设置已保存')
}
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.alarm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center; padding: 20px 0; }
.alarm-stat-val { font-size: 36px; font-weight: 700; }
.alarm-stat-label { font-size: 13px; color: #a0a0a0; margin-top: 4px; }
</style>
