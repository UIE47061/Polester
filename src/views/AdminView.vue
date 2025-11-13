<template>
  <div class="admin-view">
    <!-- 登入介面 -->
    <div v-if="!isAuthenticated" class="login-container">
      <div class="login-box">
        <h2>🔒 後台管理登入</h2>
        <p class="login-description">請輸入管理員密碼以訪問後台</p>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="password">密碼:</label>
            <input 
              type="password" 
              id="password"
              v-model="password"
              placeholder="請輸入密碼"
              required
              autofocus
            >
          </div>
          <button type="submit" class="login-btn" :disabled="!password">
            登入
          </button>
          <p v-if="loginError" class="error-message-login">
            ❌ {{ loginError }}
          </p>
        </form>
      </div>
    </div>

    <!-- 原有的後台內容 -->
    <div v-else>
      <div class="admin-header">
        <h2>後台審核頁</h2>
        <button @click="handleLogout" class="logout-btn">
          🚪 登出
        </button>
      </div>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="loading-message">
      <span class="preview-spinner"></span> 載入中...
    </div>
    
    <!-- Error message -->
    <div v-else-if="error" class="error-message">
      ⚠️ {{ error }}
      <button @click="refreshData" style="margin-left: 10px;">重試</button>
    </div>
    
    <!-- No data -->
    <p v-else-if="sortedAdvertisements.length === 0" class="no-data">
      暫無廣告記錄。
    </p>
    
    <!-- Data table -->
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>圖片</th>
          <th>敘述</th>
          <th>投放時段</th>
          <th>曝光進度</th>
          <th>狀態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ad in sortedAdvertisements" :key="ad.id">
          <td>{{ ad.id }}</td>
          <td>
            <img 
              :src="ad.image_url" 
              alt="廣告圖片" 
              class="thumbnail"
              @error="handleImageError"
            >
          </td>
          <td class="description-cell">{{ ad.description }}</td>
          <td class="time-cell">
            <div>{{ formatDateTime(ad.start_time) }}</div>
            <div>至</div>
            <div>{{ formatDateTime(ad.end_time) }}</div>
          </td>
          <td>
            {{ ad.current_impressions }} / {{ ad.impression_count }}
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${(ad.current_impressions / ad.impression_count) * 100}%` }"
              ></div>
            </div>
          </td>
          <td :class="`status-${ad.status}`">
            {{ getStatusText(ad.status) }}
          </td>
          <td class="actions-cell">
            <button 
              v-if="ad.status === 'active'"
              class="action-button pause-btn" 
              @click="handlePause(ad.id)"
              title="暫停廣告"
            >
              暫停
            </button>
            <button 
              v-if="ad.status === 'paused'"
              class="action-button resume-btn" 
              @click="handleResume(ad.id)"
              title="恢復廣告"
            >
              恢復
            </button>
            <button 
              class="action-button delete-btn" 
              @click="handleDelete(ad.id)"
              title="刪除廣告"
            >
              刪除
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdStore } from '../composables/useAdStore';
import { useAuth } from '../composables/useAuth';

const { 
  sortedAdvertisements,
  loading,
  error,
  fetchAdvertisements,
  updateAdvertisement,
  deleteAdvertisement
} = useAdStore();

const { isAuthenticated, login, logout } = useAuth();

// 登入相關
const password = ref('');
const loginError = ref('');

onMounted(() => {
  if (isAuthenticated.value) {
    refreshData();
  }
});

function handleLogin() {
  const success = login(password.value);
  if (success) {
    loginError.value = '';
    password.value = '';
    refreshData();
  } else {
    loginError.value = '密碼錯誤，請重試';
    password.value = '';
  }
}

function handleLogout() {
  if (confirm('確定要登出嗎？')) {
    logout();
    loginError.value = '';
  }
}

async function refreshData() {
  await fetchAdvertisements();
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusText(status) {
  const statusMap = {
    'active': '✅ 進行中',
    'paused': '⏸️ 已暫停',
    'completed': '✔️ 已完成'
  };
  return statusMap[status] || status;
}

async function handlePause(id) {
  if (!confirm('確定要暫停此廣告嗎？')) return;
  
  const result = await updateAdvertisement(id, { status: 'paused' });
  if (result.success) {
    alert('廣告已暫停');
  } else {
    alert(`操作失敗：${result.error}`);
  }
}

async function handleResume(id) {
  if (!confirm('確定要恢復此廣告嗎？')) return;
  
  const result = await updateAdvertisement(id, { status: 'active' });
  if (result.success) {
    alert('廣告已恢復');
  } else {
    alert(`操作失敗：${result.error}`);
  }
}

async function handleDelete(id) {
  if (!confirm(`確定要刪除 ID ${id} 的廣告嗎？此操作無法復原。`)) return;
  
  const result = await deleteAdvertisement(id);
  if (result.success) {
    alert('廣告已刪除');
  } else {
    alert(`刪除失敗：${result.error}`);
  }
}

function handleImageError(e) {
  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E無圖片%3C/text%3E%3C/svg%3E';
}
</script>

<style scoped>
.admin-view {
  width: 100%;
  margin: 0 auto;
  padding: 0 15px;
}

/* 登入介面樣式 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.login-box {
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  padding: 40px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-box h2 {
  color: var(--primary-color);
  margin-bottom: 10px;
  font-size: 1.8em;
}

.login-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 0.95em;
}

.login-box .form-group {
  text-align: left;
  margin-bottom: 20px;
}

.login-box input[type="password"] {
  padding: 12px;
  font-size: 1em;
  border: 2px solid var(--border-color);
  transition: border-color 0.3s;
}

.login-box input[type="password"]:focus {
  outline: none;
  border-color: var(--primary-color);
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 1.1em;
  font-weight: 600;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover:not(:disabled) {
  background-color: #063148;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message-login {
  color: #c0392b;
  margin-top: 15px;
  font-weight: 500;
}

/* 後台標題與登出按鈕 */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.admin-header h2 {
  margin: 0;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.loading-message {
  text-align: center;
  padding: 40px;
  color: var(--primary-color);
  font-size: 1.1em;
}

.error-message {
  text-align: center;
  padding: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin: 20px 0;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1em;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-cell {
  font-size: 0.85em;
  white-space: nowrap;
}

.time-cell div {
  margin: 2px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin-top: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--success-color);
  transition: width 0.3s ease;
}

.status-active {
  color: var(--success-color);
  font-weight: bold;
}

.status-paused {
  color: orange;
  font-weight: bold;
}

.status-completed {
  color: #666;
  font-weight: bold;
}

.actions-cell {
  white-space: nowrap;
}

.action-button {
  padding: 5px 10px;
  font-size: 0.85em;
  margin: 2px;
}

.pause-btn {
  background-color: orange;
}

.resume-btn {
  background-color: var(--success-color);
}

.delete-btn {
  background-color: #c0392b;
}

/* Desktop RWD */
@media (min-width: 992px) {
  .admin-view {
    max-width: 1600px;
    width: 100%;
    padding: 0 20px;
  }

  h2 {
    font-size: 2em;
    margin-bottom: 25px;
  }

  .thumbnail {
    width: 100px;
    height: 100px;
  }

  .description-cell {
    max-width: 300px;
  }

  .actions-cell button {
    margin: 3px;
  }
}

/* Tablet RWD */
@media (min-width: 768px) and (max-width: 991px) {
  .admin-view {
    max-width: 100%;
  }

  .thumbnail {
    width: 70px;
    height: 70px;
  }

  .description-cell {
    max-width: 180px;
  }
}

/* Mobile RWD */
@media (max-width: 767px) {
  .admin-table {
    font-size: 0.75em;
  }
  
  .thumbnail {
    width: 50px;
    height: 50px;
  }
  
  .description-cell {
    max-width: 120px;
  }

  .time-cell {
    font-size: 0.8em;
  }

  .actions-cell button {
    display: block;
    width: 100%;
    margin: 2px 0;
  }
}
</style>
