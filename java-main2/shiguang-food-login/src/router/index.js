import { createRouter, createWebHashHistory } from 'vue-router'
import EntryView from '../views/EntryView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotView from '../views/ForgotView.vue'
import HomeView from '../views/HomeView.vue'
import RestaurantView from '../views/RestaurantView.vue'
import OrderView from '../views/OrderView.vue'
import OrdersView from '../views/OrdersView.vue'
import FoodView from '../views/FoodView.vue'
import { isLoggedIn } from '../store.js'

const routes = [
  { path: '/', name: 'entry', component: EntryView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/forgot', name: 'forgot', component: ForgotView },
  { path: '/home', name: 'home', component: HomeView },
  { path: '/food', name: 'food', component: FoodView },
  { path: '/restaurant/:id', name: 'restaurant', component: RestaurantView },
  { path: '/order/:id', name: 'order', component: OrderView },
  { path: '/orders', name: 'orders', component: OrdersView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：未登录访问受保护页面时跳回登录页；已登录访问进入页直接进入首页
const PROTECTED = ['home', 'food', 'restaurant', 'order', 'orders']
router.beforeEach((to) => {
  if (PROTECTED.includes(to.name) && !isLoggedIn()) {
    return { name: 'login' }
  }
  if (to.name === 'entry' && isLoggedIn()) {
    return { name: 'home' }
  }
})

export default router
