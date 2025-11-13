import { createRouter, createWebHistory } from 'vue-router';
import PlacementView from '../views/PlacementView.vue';
import AdminView from '../views/AdminView.vue';
import DisplayView from '../views/DisplayView.vue';

const routes = [
  {
    path: '/',
    redirect: '/placement'
  },
  {
    path: '/placement',
    name: 'placement',
    component: PlacementView,
    meta: { title: '廣告投放頁' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { title: '後台審核頁' }
  },
  {
    path: '/display',
    name: 'display',
    component: DisplayView,
    meta: { title: '廣告呈現頁' }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
