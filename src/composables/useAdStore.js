import { ref, computed } from 'vue';
import apiService from '../services/api';

// Reactive state
const advertisements = ref([]);
const loading = ref(false);
const error = ref(null);

// Composable
export function useAdStore() {
  // Computed
  const activeAdvertisements = computed(() => {
    const now = new Date();
    return advertisements.value.filter(ad => {
      if (ad.status !== 'active') return false;
      const start = new Date(ad.start_time);
      const end = new Date(ad.end_time);
      return now >= start && now <= end && ad.current_impressions < ad.impression_count;
    });
  });

  const sortedAdvertisements = computed(() => {
    return [...advertisements.value].sort((a, b) => {
      // 優先顯示 active 狀態
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      // 其次按 ID 排序
      return b.id - a.id;
    });
  });

  // Actions
  async function fetchAdvertisements(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.getAdvertisements(params);
      if (response.success) {
        advertisements.value = response.data;
        return { success: true, data: response.data };
      }
      throw new Error(response.message || '獲取廣告列表失敗');
    } catch (err) {
      error.value = err.message;
      console.error('Fetch advertisements error:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }

  async function fetchActiveAdvertisements() {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.getActiveAdvertisements();
      if (response.success) {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || '獲取有效廣告失敗');
    } catch (err) {
      error.value = err.message;
      console.error('Fetch active advertisements error:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }

  async function createAdvertisement(adData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.createAdvertisement(adData);
      if (response.success) {
        // 重新獲取列表
        await fetchAdvertisements();
        return { success: true, data: response.data };
      }
      throw new Error(response.message || '建立廣告失敗');
    } catch (err) {
      error.value = err.message;
      console.error('Create advertisement error:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }

  async function updateAdvertisement(adId, updateData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.updateAdvertisement(adId, updateData);
      if (response.success) {
        // 更新本地狀態
        const index = advertisements.value.findIndex(ad => ad.id === adId);
        if (index !== -1) {
          advertisements.value[index] = response.data;
        }
        return { success: true, data: response.data };
      }
      throw new Error(response.message || '更新廣告失敗');
    } catch (err) {
      error.value = err.message;
      console.error('Update advertisement error:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }

  async function deleteAdvertisement(adId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.deleteAdvertisement(adId);
      if (response.success) {
        // 從本地狀態移除
        advertisements.value = advertisements.value.filter(ad => ad.id !== adId);
        return { success: true };
      }
      throw new Error(response.message || '刪除廣告失敗');
    } catch (err) {
      error.value = err.message;
      console.error('Delete advertisement error:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }

  async function incrementImpression(adId) {
    try {
      const response = await apiService.incrementImpression(adId);
      if (response.success) {
        // 更新本地狀態
        const index = advertisements.value.findIndex(ad => ad.id === adId);
        if (index !== -1) {
          advertisements.value[index] = response.data;
        }
        return { success: true, data: response.data };
      }
      throw new Error(response.message || '更新曝光次數失敗');
    } catch (err) {
      console.error('Increment impression error:', err);
      return { success: false, error: err.message };
    }
  }

  return {
    advertisements,
    loading,
    error,
    activeAdvertisements,
    sortedAdvertisements,
    fetchAdvertisements,
    fetchActiveAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    incrementImpression
  };
}
