import { createRouter, createWebHashHistory } from 'vue-router'
import EntryView from '../views/EntryView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotView from '../views/ForgotView.vue'
import HomeView from '../views/HomeView.vue'
import RestaurantView from '../views/RestaurantView.vue'
import OrderView from '../views/OrderView.vue'
import OrdersView from '../views/OrdersView.vue'
import OrderDetailView from '../views/OrderDetailView.vue'
import FoodView from '../views/FoodView.vue'
import ProfileView from '../views/ProfileView.vue'
import AdminLoginView from '../views/AdminLoginView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import NavManageView from '../views/admin/NavManageView.vue'
import SearchManageView from '../views/admin/SearchManageView.vue'
import RecommendManageView from '../views/admin/RecommendManageView.vue'
import DishManageView from '../views/admin/DishManageView.vue'
import PriceManageView from '../views/admin/PriceManageView.vue'
import UserManageView from '../views/admin/UserManageView.vue'
import OrderManageView from '../views/admin/OrderManageView.vue'
import { isLoggedIn, session } from '../store.js'
import { isAdminLoggedIn, canEnterAdmin, adminSession, clearAdminSession } from '../store/admin.js'

const routes = [
  { path: '/', name: 'entry', component: EntryView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/forgot', name: 'forgot', component: ForgotView },
  { path: '/home', name: 'home', component: HomeView },
  { path: '/food', name: 'food', component: FoodView },
  { path: '/restaurant/:id', name: 'restaurant', component: RestaurantView },
  { path: '/order/:id', name: 'order', component: OrderView },
  { path: '/orders', name: 'orders', component: OrdersView },
  { path: '/order-detail/:id', name: 'order-detail', component: OrderDetailView },
  { path: '/profile', name: 'profile', component: ProfileView },

  // ---------- 后台管理系统 ----------
  { path: '/admin-login', name: 'admin-login', component: AdminLoginView },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { admin: true },
    children: [
      { path: '', redirect: '/admin/nav' },
      { path: 'nav', name: 'admin-nav', component: NavManageView, meta: { admin: true } },
      { path: 'search', name: 'admin-search', component: SearchManageView, meta: { admin: true } },
      { path: 'recommend', name: 'admin-recommend', component: RecommendManageView, meta: { admin: true } },
      { path: 'dish', name: 'admin-dish', component: DishManageView, meta: { admin: true } },
      { path: 'price', name: 'admin-price', component: PriceManageView, meta: { admin: true } },
      { path: 'user', name: 'admin-user', component: UserManageView, meta: { admin: true } },
      { path: 'order', name: 'admin-order', component: OrderManageView, meta: { admin: true } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：
//  - 用户受保护页面未登录 → 登录页
//  - 后台受保护页面未登录 / 账号不在白名单 → 后台登录页
//  - 非白名单账号访问后台登录页 → 首页（后台只对 www 开放）
//  - 已登录访问进入页 → 首页
const PROTECTED = ['home', 'food', 'restaurant', 'order', 'orders', 'order-detail', 'profile']
router.beforeEach((to) => {
  if (PROTECTED.includes(to.name) && !isLoggedIn()) {
    return { name: 'login' }
  }
  // 后台只对白名单账号开放：旧会话（如 admin）一旦不合法就清掉
  if (to.meta && to.meta.admin) {
    if (!isAdminLoggedIn() || !canEnterAdmin(adminSession.account)) {
      clearAdminSession()
      return { name: 'admin-login' }
    }
  }
  if (to.name === 'admin-login' && isLoggedIn() && !canEnterAdmin(session.account)) {
    return { name: 'home' }
  }
  if (to.name === 'entry' && isLoggedIn()) {
    return { name: 'home' }
  }
})

export default router
