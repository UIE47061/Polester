<template>
  <div class="placement-view">
    <h2>廣告投放頁</h2>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="loading-message">
      <span class="preview-spinner"></span> 正在提交...
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="image-input">上傳圖片 (必填):</label>
        <input 
          type="file" 
          id="image-input" 
          accept="image/*"
          @change="handleImageUpload"
          required
        >
      </div>
      
      <div class="ad-preview">
        <img 
          v-if="previewUrl" 
          :src="previewUrl" 
          alt="廣告圖片預覽"
        >
        <p v-else class="preview-placeholder">請選擇圖片上傳</p>
      </div>

      <div class="form-group">
        <label for="description">廣告敘述:</label>
        <textarea 
          id="description" 
          v-model="description"
          required 
          rows="4"
          placeholder="請輸入廣告敘述..."
        ></textarea>
      </div>

      <div class="form-group">
        <label>投放時段:</label>
        <div style="display:flex;gap:8px;">
          <select v-model="timeStart" required>
            <option v-for="opt in timeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <select v-model="timeEnd" required>
            <option v-for="opt in timeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <small>請選擇開始與結束時間（以半小時為單位）</small>
      </div>

      <div class="form-group">
        <label for="pole-count">投放桿數量:</label>
        <input 
          type="number" 
          id="pole-count" 
          v-model.number="poleCount"
          min="1" 
          required
        >
      </div>

      <button type="submit" :disabled="!imageFile || loading">
        {{ loading ? '提交中...' : '提交投放申請' }}
      </button>
      
      <p v-if="submissionMessage" :class="['submission-message', messageType]">
        {{ submissionMessage }}
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdStore } from '../composables/useAdStore';

const { createAdvertisement, loading } = useAdStore();

// Form data
const description = ref('');
const timeStart = ref('');
const timeEnd = ref('');
const poleCount = ref(1);
const previewUrl = ref('');
const imageFile = ref(null);
const submissionMessage = ref('');
const messageType = ref('success');

// Generate time options (7 days, 30-min intervals)
function generateHalfHourOptions(days = 7) {
  const options = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const totalSlots = days * 24 * 2;
  
  for (let i = 0; i < totalSlots; i++) {
    const slot = new Date(start.getTime() + i * 30 * 60 * 1000);
    const iso = slot.toISOString().slice(0, 16);
    const label = iso.replace('T', ' ');
    options.push({ value: iso, label });
  }
  return options;
}

const timeOptions = computed(() => generateHalfHourOptions(7));

// Initialize time selects
onMounted(() => {
  const nowIso = new Date();
  const rounded = new Date(Math.ceil(nowIso.getTime() / (30*60*1000)) * (30*60*1000));
  const roundedIso = rounded.toISOString().slice(0, 16);
  
  const startIndex = timeOptions.value.findIndex(o => o.value >= roundedIso);
  if (startIndex !== -1) {
    timeStart.value = timeOptions.value[startIndex].value;
    const endIndex = Math.min(startIndex + 1, timeOptions.value.length - 1);
    timeEnd.value = timeOptions.value[endIndex].value;
  }
});

// Image upload handler
function handleImageUpload(e) {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('圖片大小不能超過 10MB');
      e.target.value = '';
      return;
    }
    
    imageFile.value = file;
    
    const reader = new FileReader();
    reader.onload = (r) => {
      previewUrl.value = r.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Form submission
async function handleSubmit() {
  if (!timeStart.value || !timeEnd.value) {
    alert('請選擇開始與結束時間。');
    return;
  }
  
  // Validate time
  const startDate = new Date(timeStart.value);
  const endDate = new Date(timeEnd.value);
  
  if (endDate <= startDate) {
    alert('結束時間必須晚於開始時間。');
    return;
  }
  
  if (!imageFile.value) {
    alert('請上傳圖片。');
    return;
  }

  // Convert to ISO 8601 format
  const startTimeISO = startDate.toISOString();
  const endTimeISO = endDate.toISOString();

  const result = await createAdvertisement({
    imageFile: imageFile.value,
    description: description.value,
    startTime: startTimeISO,
    endTime: endTimeISO,
    impressionCount: poleCount.value
  });

  if (result.success) {
    // Reset form
    description.value = '';
    poleCount.value = 1;
    previewUrl.value = '';
    imageFile.value = null;
    document.getElementById('image-input').value = '';
    
    submissionMessage.value = '投放申請已成功提交！';
    messageType.value = 'success';
  } else {
    submissionMessage.value = `提交失敗：${result.error}`;
    messageType.value = 'error';
  }
  
  setTimeout(() => {
    submissionMessage.value = '';
  }, 5000);
}
</script>

<style scoped>
.placement-view {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 15px;
}

.loading-message {
  text-align: center;
  padding: 20px;
  color: var(--primary-color);
  font-size: 1.1em;
}

.submission-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
}

.submission-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.submission-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Desktop RWD */
@media (min-width: 992px) {
  .placement-view {
    padding: 20px;
  }

  .ad-preview {
    min-height: 200px;
  }

  .ad-preview img {
    max-height: 300px;
  }

  h2 {
    font-size: 2em;
    margin-bottom: 25px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  button[type="submit"] {
    padding: 12px 30px;
    font-size: 1.1em;
  }
}

/* Tablet RWD */
@media (min-width: 768px) and (max-width: 991px) {
  .placement-view {
    max-width: 700px;
  }

  h2 {
    font-size: 1.6em;
  }
}
</style>
