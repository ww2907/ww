import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNavTop, getNavBottom, isAdminLoggedIn } from '../store/admin.js'
import { clearSession, session } from '../store.js'

// 四个前台页面共用的导航逻辑：顶部菜单 / 底部 Tab / 后台入口 / 退出
const NAV_PATH = {
  home: '/home',
  food: '/food',
  order: '/orders',
  mine: '/profile'
}

export function useShellNav(initial = 'home') {
  const router = useRouter()
  const route = useRoute()

  // 导航项来自后台「导航管理」配置，四页读取同一份数据，保证顺序与文案一致
  const topNav = computed(() =>
    getNavTop().map((n) => ({ key: n.id, label: n.label, icon: n.icon }))
  )
  const bottomNav = computed(() =>
    getNavBottom().map((n) => ({ key: n.id, label: n.label, icon: n.icon }))
  )

  const activeNav = ref(initial)
  const account = computed(() => session.account || '美食家')

  function setActive(key) {
    activeNav.value = key
  }

  // 返回 true 表示已处理；false 表示该入口尚未开发（页面可自行提示）
  function onNav(item) {
    const path = NAV_PATH[item.key]
    if (!path) return false
    activeNav.value = item.key
    if (route.path !== path) router.push(path)
    return true
  }

  function goAdmin() {
    router.push(isAdminLoggedIn() ? '/admin' : '/admin-login')
  }

  function logout() {
    clearSession()
    router.push('/login')
  }

  return { topNav, bottomNav, activeNav, account, setActive, onNav, goAdmin, logout }
}
