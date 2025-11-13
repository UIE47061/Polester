<template>
  <div class="placement-view">
    <h2>廣告投放頁</h2>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="loading-message">
      <span class="preview-spinner"></span> 正在提交...
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>圖片來源:</label>
        <div class="image-source-toggle">
          <button 
            type="button" 
            :class="['toggle-btn', { active: imageSource === 'upload' }]"
            @click="imageSource = 'upload'"
          >
            📤 上傳圖片
          </button>
          <button 
            type="button" 
            :class="['toggle-btn', { active: imageSource === 'ai' }]"
            @click="imageSource = 'ai'"
          >
            🤖 AI 產圖
          </button>
        </div>
      </div>

      <!-- Upload Image Section -->
      <div v-if="imageSource === 'upload'" class="form-group">
        <label for="image-input">上傳圖片 (必填):</label>
        <input 
          type="file" 
          id="image-input" 
          accept="image/*"
          @change="handleImageUpload"
          :required="imageSource === 'upload'"
        >
      </div>

      <!-- AI Generate Section -->
      <div v-if="imageSource === 'ai'" class="form-group">
        <label for="ai-prompt">AI 產圖描述 (必填):</label>
        <textarea 
          id="ai-prompt" 
          v-model="aiPrompt"
          :required="imageSource === 'ai'"
          rows="3"
          placeholder="請描述你想要的圖片內容，例如：一隻可愛的橘貓坐在窗台上看著夕陽..."
        ></textarea>
        <button 
          type="button" 
          class="ai-generate-btn"
          @click="handleAIGenerate"
          :disabled="!aiPrompt || aiGenerating"
        >
          {{ aiGenerating ? '生成中...' : '🎨 生成圖片' }}
        </button>
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
const imageSource = ref('upload'); // 'upload' or 'ai'
const aiPrompt = ref('');
const aiGenerating = ref(false);
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

// AI Generate handler (placeholder for API integration)
async function handleAIGenerate() {
  if (!aiPrompt.value.trim()) {
    alert('請輸入圖片描述');
    return;
  }

  aiGenerating.value = true;
  
  try {
    // TODO: 串接 AI 產圖 API
    // const response = await fetch('YOUR_AI_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ prompt: aiPrompt.value })
    // });
    // const data = await response.json();
    // const imageUrl = data.imageUrl;
    
    // 暫時使用佔位圖片模擬
    alert('AI 產圖功能即將推出！\n您的描述：' + aiPrompt.value);
    
    // 模擬生成延遲
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 這裡之後要改成從 API 取得的圖片
    // previewUrl.value = imageUrl;
    // 需要將 URL 轉換為 File 物件
    // imageFile.value = await urlToFile(imageUrl, 'ai-generated.png');
    
  } catch (error) {
    console.error('AI 產圖失敗:', error);
    alert('AI 產圖失敗，請稍後再試');
  } finally {
    aiGenerating.value = false;
  }
}

// Helper function to convert URL to File (for future use)
async function urlToFile(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
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
    if (imageSource.value === 'upload') {
      alert('請上傳圖片。');
    } else {
      alert('請先使用 AI 生成圖片。');
    }
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
    imageSource.value = 'upload';
    aiPrompt.value = '';
    description.value = '';
    poleCount.value = 1;
    previewUrl.value = '';
    imageFile.value = null;
    const uploadInput = document.getElementById('image-input');
    if (uploadInput) uploadInput.value = '';
    
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
  padding: 15px 10px;
}

h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 20px;
  font-size: 1.4em;
}

form {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="file"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.9em;
}

.image-source-toggle {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.toggle-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  color: #333;
}

.toggle-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.toggle-btn:hover:not(.active) {
  border-color: var(--primary-color);
  background: #f0f8ff;
}

.ai-generate-btn {
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.3s;
}

.ai-generate-btn:hover:not(:disabled) {
  background: #45a049;
}

.ai-generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.ad-preview {
  margin: 15px 0;
  padding: 15px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  background: #f9f9f9;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  object-fit: contain;
}

.preview-placeholder {
  color: #999;
  font-style: italic;
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

button[type="submit"]:hover:not(:disabled) {
  background: #1565c0;
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Tablet RWD */
@media (min-width: 768px) and (max-width: 991px) {
  .placement-view {
    max-width: 700px;
    padding: 20px;
  }

  h2 {
    font-size: 1.6em;
  }

  form {
    padding: 20px;
  }
}

/* Desktop RWD */
@media (min-width: 992px) {
  .placement-view {
    padding: 30px 20px;
  }

  h2 {
    font-size: 2em;
    margin-bottom: 25px;
  }

  form {
    padding: 30px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .ad-preview {
    min-height: 200px;
  }

  .ad-preview img {
    max-height: 300px;
  }

  button[type="submit"] {
    padding: 12px 30px;
    font-size: 1.1em;
  }

  .toggle-btn {
    font-size: 16px;
  }

  .ai-generate-btn {
    font-size: 16px;
  }
}
</style>
