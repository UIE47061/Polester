// API Base URL
const API_BASE_URL = 'https://uie47061-polester-backend.hf.space';

/**
 * API Service for Polester Backend
 */
class ApiService {
  /**
   * 通用 fetch 處理函數
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      // 檢查回應狀態
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * 建立新廣告
   * @param {File} imageFile - 圖片檔案
   * @param {string} description - 廣告敘述
   * @param {string} startTime - ISO 8601 格式開始時間
   * @param {string} endTime - ISO 8601 格式結束時間
   * @param {number} impressionCount - 投放桿數量
   * @returns {Promise<Object>}
   */
  async createAdvertisement({ imageFile, description, startTime, endTime, impressionCount }) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('description', description);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    formData.append('impression_count', impressionCount);

    return await this.request('/advertisements/', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * 獲取廣告列表
   * @param {Object} params - 查詢參數
   * @param {string} params.status - 狀態篩選 (active, paused, completed)
   * @param {number} params.limit - 返回數量限制
   * @param {number} params.offset - 偏移量
   * @returns {Promise<Object>}
   */
  async getAdvertisements({ status = null, limit = 100, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('offset', offset);

    return await this.request(`/advertisements/?${params.toString()}`);
  }

  /**
   * 獲取有效廣告（當前可投放的廣告）
   * @returns {Promise<Object>}
   */
  async getActiveAdvertisements() {
    return await this.request('/advertisements/active');
  }

  /**
   * 獲取單一廣告
   * @param {number} adId - 廣告 ID
   * @returns {Promise<Object>}
   */
  async getAdvertisement(adId) {
    return await this.request(`/advertisements/${adId}`);
  }

  /**
   * 更新廣告
   * @param {number} adId - 廣告 ID
   * @param {Object} updateData - 要更新的資料
   * @returns {Promise<Object>}
   */
  async updateAdvertisement(adId, updateData) {
    return await this.request(`/advertisements/${adId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  }

  /**
   * 增加廣告曝光次數
   * @param {number} adId - 廣告 ID
   * @returns {Promise<Object>}
   */
  async incrementImpression(adId) {
    return await this.request(`/advertisements/${adId}/impression`, {
      method: 'POST',
    });
  }

  /**
   * 刪除廣告
   * @param {number} adId - 廣告 ID
   * @returns {Promise<Object>}
   */
  async deleteAdvertisement(adId) {
    return await this.request(`/advertisements/${adId}`, {
      method: 'DELETE',
    });
  }
}

// 導出單例
export default new ApiService();
