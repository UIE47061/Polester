<template>
  <div class="display-view">
    <h2>廣告呈現頁</h2>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="loading-message">
      <span class="preview-spinner"></span> 載入中...
    </div>
    
    <!-- Error message -->
    <div v-else-if="error" class="error-message">
      ⚠️ {{ error }}
      <button @click="refreshAds" style="margin-left: 10px;">重試</button>
    </div>
    
    <!-- Display area -->
    <div v-else class="ad-display-container">
      <template v-if="activeAds.length > 0">
        <div class="ad-carousel">
          <div v-for="(ad, index) in activeAds" :key="ad.id" class="ad-slide" :class="{ active: index === currentIndex }">
            <img 
              :src="ad.image_url" 
              :alt="ad.description"
              @error="handleImageError"
              class="ad-image"
            >
            <div class="ad-info">
              <p class="ad-description">{{ ad.description }}</p>
              <p class="ad-meta">
                曝光: {{ ad.current_impressions }} / {{ ad.impression_count }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Carousel controls -->
        <div v-if="activeAds.length > 1" class="carousel-controls">
          <button @click="prevAd" class="carousel-btn">◀</button>
          <div class="carousel-indicators">
            <span 
              v-for="(ad, index) in activeAds" 
              :key="ad.id"
              class="indicator"
              :class="{ active: index === currentIndex }"
              @click="goToAd(index)"
            ></span>
          </div>
          <button @click="nextAd" class="carousel-btn">▶</button>
        </div>
        
        <!-- Auto-refresh info -->
        <p class="refresh-info">
          ⟳ 每 30 秒自動切換廣告
        </p>
      </template>
      
      <div v-else class="no-ads">
        <p>目前沒有可展示的廣告</p>
        <small>請至廣告投放頁提交新廣告</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAdStore } from '../composables/useAdStore';

const { fetchActiveAdvertisements, loading, error } = useAdStore();

const activeAds = ref([]);
const currentIndex = ref(0);
let refreshInterval = null;
let carouselInterval = null;

onMounted(async () => {
  await refreshAds();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(refreshAds, 30000);
  
  // Auto-carousel if multiple ads
  if (activeAds.value.length > 1) {
    carouselInterval = setInterval(nextAd, 10000);
  }
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (carouselInterval) clearInterval(carouselInterval);
});

async function refreshAds() {
  const result = await fetchActiveAdvertisements();
  if (result.success) {
    activeAds.value = result.data;
    
    // Reset carousel if needed
    if (currentIndex.value >= activeAds.value.length) {
      currentIndex.value = 0;
    }
    
    // Setup carousel for multiple ads
    if (carouselInterval) clearInterval(carouselInterval);
    if (activeAds.value.length > 1) {
      carouselInterval = setInterval(nextAd, 10000);
    }
  }
}

function nextAd() {
  if (activeAds.value.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % activeAds.value.length;
}

function prevAd() {
  if (activeAds.value.length === 0) return;
  currentIndex.value = (currentIndex.value - 1 + activeAds.value.length) % activeAds.value.length;
}

function goToAd(index) {
  currentIndex.value = index;
}

function handleImageError(e) {
  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3E圖片載入失敗%3C/text%3E%3C/svg%3E';
}
</script>

<style scoped>
.display-view {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  width: 100%;
  padding: 0 15px;
}

.loading-message {
  padding: 60px 20px;
  color: var(--primary-color);
  font-size: 1.1em;
}

.error-message {
  padding: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin: 20px 0;
}

.ad-display-container {
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ad-carousel {
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 600px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ad-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  display: flex;
  flex-direction: column;
}

.ad-slide.active {
  opacity: 1;
  z-index: 1;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f5f5f5;
}

.ad-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  padding: 20px;
  text-align: left;
}

.ad-description {
  font-size: 1.1em;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.ad-meta {
  font-size: 0.9em;
  margin: 0;
  opacity: 0.9;
}

.carousel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.carousel-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2em;
  transition: background-color 0.3s;
}

.carousel-btn:hover {
  background-color: #063148;
}

.carousel-indicators {
  display: flex;
  gap: 10px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  cursor: pointer;
  transition: background-color 0.3s;
}

.indicator.active {
  background-color: var(--primary-color);
}

.indicator:hover {
  background-color: #888;
}

.refresh-info {
  margin-top: 20px;
  color: #666;
  font-size: 0.9em;
}

.no-ads {
  padding: 60px 20px;
  color: #666;
}

.no-ads p {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.no-ads small {
  color: #999;
}

/* Desktop RWD */
@media (min-width: 992px) {
  .display-view {
    max-width: 1200px;
  }

  h2 {
    font-size: 2em;
    margin-bottom: 30px;
  }

  .ad-carousel {
    max-width: 800px;
    height: 700px;
  }

  .ad-info {
    padding: 30px;
  }

  .ad-description {
    font-size: 1.3em;
  }

  .ad-meta {
    font-size: 1em;
  }

  .carousel-btn {
    padding: 12px 24px;
    font-size: 1.3em;
  }

  .indicator {
    width: 14px;
    height: 14px;
  }
}

/* Tablet RWD */
@media (min-width: 768px) and (max-width: 991px) {
  .ad-carousel {
    max-width: 600px;
    height: 500px;
  }

  h2 {
    font-size: 1.6em;
  }
}

/* Mobile RWD */
@media (max-width: 767px) {
  .ad-carousel {
    max-width: 100%;
    height: 350px;
  }

  .ad-info {
    padding: 15px;
  }

  .ad-description {
    font-size: 1em;
  }

  .ad-meta {
    font-size: 0.85em;
  }

  .carousel-btn {
    padding: 8px 16px;
    font-size: 1em;
  }

  .carousel-indicators {
    gap: 8px;
  }

  .indicator {
    width: 10px;
    height: 10px;
  }
}
</style>
