<template>
  <div class="display-view">
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
      </template>
      
      <div v-else class="no-ads">
        <p>目前沒有可展示的廣告</p>
        <small>請至廣告投放頁提交新廣告</small>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="bottom-bar">
      <div class="bottom-bar-content">
        <div class="bottom-text">
          街頭個人化廣告投放 | 30分鐘只要150 | 打造你的街頭曝光時刻
        </div>
        <div class="bottom-qrcode">
          <img src="../assets/qrcode.png" alt="QR Code" />
        </div>
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
  width: 100%;
  height: 90vh;
  margin: 0;
  padding: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
}

.loading-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1em;
}

.error-message {
  margin: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.ad-display-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  position: relative;
}

.ad-carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 80px);
  overflow: hidden;
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
  background-color: #000;
}

.ad-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, transparent 100%);
  color: white;
  padding: 60px 30px 30px 30px;
  text-align: left;
  z-index: 2;
}

.ad-description {
  font-size: 1.3em;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.ad-meta {
  font-size: 1em;
  margin: 0;
  opacity: 0.9;
}

.carousel-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 3;
}

.carousel-btn {
  background-color: rgba(9, 67, 98, 0.8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.3em;
  transition: background-color 0.3s;
}

.carousel-btn:hover {
  background-color: rgba(6, 49, 72, 0.9);
}

.carousel-indicators {
  display: flex;
  gap: 10px;
}

.indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background-color 0.3s;
}

.indicator.active {
  background-color: white;
}

.indicator:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.no-ads {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 60px 20px;
}

.no-ads p {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.no-ads small {
  color: #ccc;
}

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #094362;
  color: white;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

.bottom-bar-content {
  width: 100%;
  max-width: 1400px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bottom-text {
  font-size: 1.2em;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.bottom-qrcode {
  display: flex;
  align-items: center;
}

.bottom-qrcode img {
  height: 60px;
  width: 60px;
  background: white;
  padding: 4px;
  border-radius: 4px;
}

/* Tablet RWD */
@media (min-width: 768px) and (max-width: 991px) {
  .ad-carousel {
    height: calc(100% - 70px);
  }

  .ad-info {
    bottom: 0;
    padding: 50px 25px 25px 25px;
  }

  .ad-description {
    font-size: 1.2em;
  }

  .carousel-controls {
    bottom: 15px;
  }

  .bottom-bar {
    height: 70px;
  }

  .bottom-text {
    font-size: 1em;
  }

  .bottom-qrcode img {
    height: 50px;
    width: 50px;
  }
}

/* Mobile RWD */
@media (max-width: 767px) {
  .ad-carousel {
    height: calc(100% - 100px);
  }

  .ad-info {
    bottom: 0;
    padding: 40px 15px 15px 15px;
  }

  .ad-description {
    font-size: 0.95em;
  }

  .ad-meta {
    font-size: 0.85em;
  }

  .carousel-controls {
    bottom: 10px;
    gap: 15px;
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

  .bottom-bar {
    height: 100px;
  }

  .bottom-bar-content {
    padding: 0 15px;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
  }

  .bottom-text {
    font-size: 0.85em;
    text-align: center;
    line-height: 1.4;
  }

  .bottom-qrcode img {
    height: 45px;
    width: 45px;
  }
}
</style>
