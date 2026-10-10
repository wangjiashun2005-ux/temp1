<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">TinyML 模型管理</span>
      <div>
        <el-button @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon> 上传模型
        </el-button>
        <el-button type="primary" @click="showTrainDialog = true">
          <el-icon><MagicStick /></el-icon> 新建训练
        </el-button>
      </div>
    </div>

    <!-- Model Slots Overview -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>模型槽位状态</template>
      <div class="model-slots">
        <div v-for="(slot, i) in modelSlots" :key="i" class="model-slot" :class="{ active: slot.active, loaded: slot.loaded }">
          <div class="slot-header">
            <span class="slot-id">槽位 {{ i + 1 }}</span>
            <el-tag v-if="slot.loaded" type="success" size="small" effect="dark">已加载</el-tag>
            <el-tag v-else-if="slot.active" type="primary" size="small" effect="dark">已训练</el-tag>
            <el-tag v-else type="info" size="small" effect="dark">空闲</el-tag>
          </div>
          <div v-if="slot.name" class="slot-info">
            <div class="slot-name">{{ slot.name }}</div>
            <div class="slot-meta">v{{ slot.version }} | {{ slot.size }}KB | {{ slot.type }}</div>
            <div class="slot-meta">准确率: {{ slot.accuracy }}% | 延迟: {{ slot.latency }}ms</div>
          </div>
          <div v-else class="slot-empty">未分配</div>
          <div class="slot-actions">
            <el-button v-if="slot.loaded" text size="small" type="warning" @click="unloadModel(i)">卸载</el-button>
            <el-button v-if="slot.loaded" text size="small" type="primary" @click="runInference(i)">推理测试</el-button>
            <el-button v-if="slot.active && !slot.loaded" text size="small" type="success" @click="loadModel(i)">加载</el-button>
            <el-button v-if="slot.active" text size="small" type="danger" @click="deleteModel(i)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <div class="card-grid">
      <!-- Training History -->
      <el-card shadow="never">
        <template #header>训练历史</template>
        <el-table :data="trainingHistory" size="small" max-height="350">
          <el-table-column prop="name" label="模型名称" width="160" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="accuracy" label="准确率" width="80" />
          <el-table-column prop="epochs" label="轮次" width="60" />
          <el-table-column prop="size" label="大小" width="70" />
          <el-table-column prop="date" label="日期" width="140" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'training' ? 'warning' : 'info'" size="small" effect="dark">
                {{ row.status === 'completed' ? '完成' : row.status === 'training' ? '训练中' : '队列中' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Model Metrics -->
      <el-card shadow="never">
        <template #header>模型性能指标</template>
        <div v-if="selectedModel" class="model-metrics">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="模型名称">{{ selectedModel.name }}</el-descriptions-item>
            <el-descriptions-item label="模型类型">{{ selectedModel.type }}</el-descriptions-item>
            <el-descriptions-item label="输入维度">{{ selectedModel.inputDim }}</el-descriptions-item>
            <el-descriptions-item label="输出维度">{{ selectedModel.outputDim }}</el-descriptions-item>
            <el-descriptions-item label="模型大小">{{ selectedModel.size }}KB</el-descriptions-item>
            <el-descriptions-item label="推理延迟">{{ selectedModel.latency }}ms</el-descriptions-item>
            <el-descriptions-item label="Flash 占用">{{ selectedModel.flash }}KB</el-descriptions-item>
            <el-descriptions-item label="RAM 占用">{{ selectedModel.ram }}KB</el-descriptions-item>
            <el-descriptions-item label="量化精度">{{ selectedModel.quantization }}</el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:12px">
            <el-button size="small" @click="selectedModel = models[0]">轴承故障检测</el-button>
            <el-button size="small" @click="selectedModel = models[1]">电机异常检测</el-button>
          </div>
        </div>
        <div v-else class="no-model">请选择模型查看详情</div>
      </el-card>
    </div>

    <!-- Training Progress -->
    <el-card v-if="isTraining" shadow="never" style="margin-top:16px">
      <template #header>
        <div class="card-header-row">
          <span>训练进度 - {{ currentTraining.name }}</span>
          <el-tag type="warning" effect="dark" size="small">训练中</el-tag>
        </div>
      </template>
      <div class="training-progress">
        <el-progress :percentage="trainProgress" :stroke-width="12" />
        <div class="train-info">
          <span>轮次: {{ trainEpoch }}/{{ trainTotalEpochs }}</span>
          <span>Loss: {{ trainLoss.toFixed(4) }}</span>
          <span>Accuracy: {{ trainAccuracy.toFixed(1) }}%</span>
          <span>预计剩余: {{ trainRemaining }}</span>
        </div>
        <div class="train-actions" style="margin-top:12px">
          <el-button size="small" type="danger" @click="stopTraining">停止训练</el-button>
        </div>
      </div>
    </el-card>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="上传模型文件" width="480px">
      <el-upload drag action="#" :auto-upload="false" accept=".tflite,.onnx,.bin,.h5" :on-change="handleUpload">
        <el-icon :size="40" color="#909399"><Upload /></el-icon>
        <div>将模型文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div>支持格式: TFLite, ONNX, BIN, H5 | 最大 2MB</div>
        </template>
      </el-upload>
      <el-form label-width="100px" style="margin-top:16px">
        <el-form-item label="模型名称"><el-input v-model="uploadName" /></el-form-item>
        <el-form-item label="目标槽位">
          <el-select v-model="uploadSlot" style="width:100%">
            <el-option v-for="(s, i) in modelSlots" :key="i" :label="`槽位 ${i+1}`" :value="i" :disabled="s.loaded" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">上传并部署</el-button>
      </template>
    </el-dialog>

    <!-- New Training Dialog -->
    <el-dialog v-model="showTrainDialog" title="新建训练任务" width="520px">
      <el-form :model="trainForm" label-width="110px">
        <el-form-item label="模型名称"><el-input v-model="trainForm.name" /></el-form-item>
        <el-form-item label="模型类型">
          <el-select v-model="trainForm.type" style="width:100%">
            <el-option label="TensorFlow Lite" value="tflite" />
            <el-option label="ONNX Runtime" value="onnx" />
            <el-option label="Edge Impulse" value="edge_impulse" />
            <el-option label="自定义 (C/C++)" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用场景">
          <el-select v-model="trainForm.scene" style="width:100%">
            <el-option label="轴承故障检测" value="bearing" />
            <el-option label="电机异常检测" value="motor" />
            <el-option label="温度异常预测" value="temperature" />
            <el-option label="振动频谱分类" value="spectrum" />
            <el-option label="声纹识别" value="acoustic" />
            <el-option label="自定义分类" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="训练轮次"><el-input-number v-model="trainForm.epochs" :min="10" :max="1000" :step="10" /></el-form-item>
        <el-form-item label="学习率"><el-input v-model="trainForm.lr" /></el-form-item>
        <el-form-item label="批大小"><el-input-number v-model="trainForm.batchSize" :min="8" :max="256" :step="8" /></el-form-item>
        <el-form-item label="量化">
          <el-select v-model="trainForm.quantization" style="width:100%">
            <el-option label="无量化 (Float32)" value="none" />
            <el-option label="动态量化 (INT8)" value="dynamic_int8" />
            <el-option label="静态量化 (INT8)" value="static_int8" />
            <el-option label="Float16" value="float16" />
          </el-select>
        </el-form-item>
        <el-form-item label="训练集">
          <el-select v-model="trainForm.dataset" style="width:100%">
            <el-option label="设备振动数据集 (V1)" value="vibration_v1" />
            <el-option label="设备振动数据集 (V2 增强)" value="vibration_v2" />
            <el-option label="温度-电流联合数据集" value="temp_current" />
            <el-option label="综合多传感器数据集" value="multi_sensor" />
          </el-select>
        </el-form-item>
        <el-form-item label="部署槽位">
          <el-select v-model="trainForm.slot" style="width:100%">
            <el-option v-for="(s, i) in modelSlots" :key="i" :label="`槽位 ${i+1}`" :value="i" :disabled="s.loaded" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTrainDialog = false">取消</el-button>
        <el-button type="primary" @click="startTraining">开始训练</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { randomBetween, randomInt } from '../../utils/mock'
import { deviceApi } from '../../utils/deviceApi'
import dayjs from 'dayjs'

const showUploadDialog = ref(false)
const showTrainDialog = ref(false)
const isTraining = ref(false)
const trainProgress = ref(0)
const trainEpoch = ref(0)
const trainTotalEpochs = ref(100)
const trainLoss = ref(1.0)
const trainAccuracy = ref(0)
const trainRemaining = ref('--')
const uploadName = ref('')
const uploadSlot = ref(0)
let trainTimer = null

const modelSlots = reactive([
  { name: '轴承故障检测 v1.2', version: '1.2', size: 86, type: 'TFLite', active: true, loaded: true, accuracy: 97.8, latency: 2.1 },
  { name: '电机异常检测 v0.9', version: '0.9', size: 124, type: 'TFLite', active: true, loaded: true, accuracy: 95.2, latency: 3.4 },
  { name: '声纹分类 v2.0', version: '2.0', size: 210, type: 'ONNX', active: true, loaded: false, accuracy: 93.5, latency: 5.2 },
  { name: null, version: '', size: 0, type: '', active: false, loaded: false, accuracy: 0, latency: 0 },
])

const models = reactive([
  { name: '轴承故障检测 v1.2', type: 'CNN + LSTM', inputDim: '128x3', outputDim: '4类', size: 86, latency: 2.1, flash: 180, ram: 45, quantization: 'INT8' },
  { name: '电机异常检测 v0.9', type: '1D-CNN', inputDim: '256x6', outputDim: '2类', size: 124, latency: 3.4, flash: 260, ram: 68, quantization: 'Float16' },
])
const selectedModel = ref(models[0])

const trainingHistory = reactive([
  { name: '轴承故障检测 v1.2', type: 'TFLite', accuracy: '97.8%', epochs: 200, size: '86KB', date: '2024-03-15 14:30', status: 'completed' },
  { name: '电机异常检测 v0.9', type: 'TFLite', accuracy: '95.2%', epochs: 150, size: '124KB', date: '2024-03-14 10:20', status: 'completed' },
  { name: '声纹分类 v2.0', type: 'ONNX', accuracy: '93.5%', epochs: 300, size: '210KB', date: '2024-03-13 16:45', status: 'completed' },
  { name: '温度预测 v0.1', type: 'TFLite', accuracy: '88.1%', epochs: 100, size: '42KB', date: '2024-03-12 09:00', status: 'completed' },
])

const trainForm = reactive({
  name: '新模型', type: 'tflite', scene: 'bearing', epochs: 100, lr: '0.001', batchSize: 32, quantization: 'dynamic_int8', dataset: 'vibration_v1', slot: 3,
})

const currentTraining = reactive({ name: '' })

function loadModel(i) {
  modelSlots[i].loaded = true
  deviceApi.modelAction({ slot: i, action: 'load', name: modelSlots[i].name })
  ElMessage.success(`槽位 ${i+1} 模型已加载`)
}

function unloadModel(i) {
  modelSlots[i].loaded = false
  deviceApi.modelAction({ slot: i, action: 'unload', name: modelSlots[i].name })
  ElMessage.success(`槽位 ${i+1} 模型已卸载`)
}

function deleteModel(i) {
  const name = modelSlots[i].name
  modelSlots[i] = { name: null, version: '', size: 0, type: '', active: false, loaded: false, accuracy: 0, latency: 0 }
  deviceApi.modelAction({ slot: i, action: 'delete', name })
  ElMessage.success('模型已删除')
}

function runInference(i) {
  deviceApi.modelAction({ slot: i, action: 'inference', name: modelSlots[i].name })
  ElMessage.info(`正在对槽位 ${i+1} 执行推理测试...`)
  setTimeout(() => {
    const labels = ['正常', '早期磨损', '中期故障', '严重故障']
    ElMessage.success(`推理完成: ${labels[randomInt(0,3)]} (置信度: ${randomBetween(85,99)}%)`)
  }, 1500)
}

function handleUpload() {
  uploadName.value = '上传的模型'
  ElMessage.success('模型文件已选择')
}

function confirmUpload() {
  showUploadDialog.value = false
  deviceApi.uploadModel({ name: uploadName.value, slot: uploadSlot.value })
  ElMessage.success('模型上传成功，已部署到槽位')
}

function startTraining() {
  if (!trainForm.name) { ElMessage.warning('请输入模型名称'); return }
  showTrainDialog.value = false
  deviceApi.startTraining({ ...trainForm })
  isTraining.value = true
  currentTraining.name = trainForm.name
  trainTotalEpochs.value = trainForm.epochs
  trainEpoch.value = 0
  trainProgress.value = 0
  trainLoss.value = randomBetween(1.5, 3.0)
  trainAccuracy.value = randomBetween(40, 60)
  ElMessage.success('训练任务已启动')
  trainTimer = setInterval(() => {
    trainEpoch.value++
    trainProgress.value = Math.min(100, Math.round((trainEpoch.value / trainTotalEpochs.value) * 100))
    trainLoss.value = Math.max(0.05, trainLoss.value * randomBetween(0.95, 0.99))
    trainAccuracy.value = Math.min(99.5, trainAccuracy.value + randomBetween(0.1, 0.8))
    const remaining = (trainTotalEpochs.value - trainEpoch.value) * randomBetween(0.5, 1.5)
    trainRemaining.value = remaining > 60 ? `${Math.round(remaining/60)}分钟` : `${Math.round(remaining)}秒`
    if (trainEpoch.value >= trainTotalEpochs.value) {
      clearInterval(trainTimer)
      isTraining.value = false
      trainingHistory.unshift({
        name: trainForm.name, type: trainForm.type.toUpperCase(),
        accuracy: `${trainAccuracy.value.toFixed(1)}%`, epochs: trainTotalEpochs.value,
        size: `${randomInt(50, 200)}KB`, date: dayjs().format('YYYY-MM-DD HH:mm'), status: 'completed',
      })
      modelSlots[trainForm.slot] = {
        name: `${trainForm.name} v1.0`, version: '1.0', size: randomInt(50, 200),
        type: trainForm.type === 'tflite' ? 'TFLite' : 'ONNX', active: true, loaded: true,
        accuracy: parseFloat(trainAccuracy.value.toFixed(1)),
        latency: randomBetween(1.5, 6.0),
      }
      ElMessage.success('模型训练完成！已自动加载到槽位')
    }
  }, 300)
}

function stopTraining() {
  clearInterval(trainTimer)
  isTraining.value = false
  ElMessage.warning('训练已停止')
}
</script>

<style scoped>
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.model-slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.model-slot { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); }
.model-slot.loaded { border-color: #2ecc71; }
.model-slot.active { border-color: #3498db; }
.slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.slot-id { font-weight: 600; font-size: 14px; }
.slot-info .slot-name { font-size: 13px; margin-bottom: 4px; }
.slot-meta { font-size: 11px; color: #a0a0a0; }
.slot-empty { text-align: center; color: #555; padding: 20px 0; font-size: 13px; }
.slot-actions { margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap; }
.model-metrics { padding: 0; }
.training-progress { padding: 8px 0; }
.train-info { display: flex; gap: 24px; margin-top: 12px; font-size: 13px; color: #a0a0a0; }
.no-model { text-align: center; color: #555; padding: 40px 0; }
</style>
