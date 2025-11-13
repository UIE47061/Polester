import { ref } from 'vue';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const AUTH_KEY = 'polester_admin_auth';

const isAuthenticated = ref(false);

// 檢查是否已登入
function checkAuth() {
  const stored = sessionStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      // 檢查是否在同一個瀏覽器 session 內
      if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        isAuthenticated.value = true;
        return true;
      }
    } catch (e) {
      console.error('Auth check error:', e);
    }
  }
  isAuthenticated.value = false;
  return false;
}

// 登入
function login(password) {
  if (password === ADMIN_PASSWORD) {
    const authData = {
      authenticated: true,
      timestamp: Date.now()
    };
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    isAuthenticated.value = true;
    return true;
  }
  return false;
}

// 登出
function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  isAuthenticated.value = false;
}

// 初始化時檢查
checkAuth();

export function useAuth() {
  return {
    isAuthenticated,
    login,
    logout,
    checkAuth
  };
}
