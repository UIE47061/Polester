<script setup>
import { ref } from 'vue';
import { RouterView } from 'vue-router';

const menuVisible = ref(false);

function toggleMenu() {
  menuVisible.value = !menuVisible.value;
}

function closeMenu() {
  if (window.innerWidth < 768) {
    menuVisible.value = false;
  }
}
</script>

<template>
  <div id="app">
    <header>
      <h1 class="brand">
        <img 
          src="/src/assets/logo.png" 
          alt="Polester logo" 
          class="brand-logo"
        >
        <span class="brand-text">Polester</span>
      </h1>
      <nav class="main-nav">
        <button 
          class="hamburger-menu" 
          @click="toggleMenu"
          :aria-expanded="menuVisible"
          aria-controls="menu-items"
        >
          &#9776;
        </button>
        <ul 
          id="menu-items" 
          class="nav-menu"
          :class="{ visible: menuVisible, hidden: !menuVisible }"
        >
          <li>
            <router-link to="/placement" @click="closeMenu">
              廣告投放頁
            </router-link>
          </li>
          <li>
            <router-link to="/admin" @click="closeMenu">
              後台頁
            </router-link>
          </li>
          <li>
            <router-link to="/display" @click="closeMenu">
              廣告呈現頁
            </router-link>
          </li>
        </ul>
      </nav>
    </header>

    <main id="app-container">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import './assets/styles.css';

* {
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

header {
  background-color: var(--primary-color);
  color: var(--secondary-color);
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.2em;
}

.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 6px;
  background: transparent;
}

.brand-text {
  font-weight: 600;
  color: var(--secondary-color);
}

.hamburger-menu {
  background: none;
  border: none;
  color: var(--secondary-color);
  font-size: 1.8em;
  cursor: pointer;
  padding: 5px;
  display: block;
  z-index: 1001;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 60px;
  right: 0;
  background-color: var(--primary-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: 200px;
  z-index: 1000;
  transition: transform 0.3s ease-out;
  transform: translateX(100%);
}

.nav-menu.visible {
  transform: translateX(0);
}

.nav-menu.hidden {
  display: none;
}

.nav-menu li a {
  display: block;
  padding: 15px 20px;
  text-decoration: none;
  color: var(--secondary-color);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-menu li a:hover,
.nav-menu li a.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}

main {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}

/* 桌面版 RWD - 顯示水平導航列 */
@media (min-width: 992px) {
  header {
    padding: 15px 40px;
  }

  .hamburger-menu {
    display: none;
  }

  .nav-menu {
    position: static;
    display: flex;
    flex-direction: row;
    width: auto;
    box-shadow: none;
    transform: none;
    background-color: transparent;
  }

  .nav-menu.hidden,
  .nav-menu.visible {
    display: flex;
    transform: none;
  }

  .nav-menu li {
    margin: 0;
  }

  .nav-menu li a {
    padding: 10px 20px;
    border-bottom: none;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .nav-menu li a:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .nav-menu li a.router-link-active {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }

  .brand {
    font-size: 1.5em;
  }

  .brand-logo {
    width: 50px;
    height: 50px;
  }
}

/* 平板版 RWD */
@media (min-width: 768px) and (max-width: 991px) {
  header {
    padding: 12px 30px;
  }

  .brand {
    font-size: 1.3em;
  }

  .brand-logo {
    width: 45px;
    height: 45px;
  }
}
</style>
