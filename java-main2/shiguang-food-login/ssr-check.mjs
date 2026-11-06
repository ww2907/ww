import { createServer } from 'vite'
import { createRequire } from 'module'

globalThis.window = globalThis
globalThis.history = {
  state: {}, pushState() {}, replaceState() {}, go() {}, back() {}, forward() {}
}
globalThis.addEventListener = () => {}
globalThis.removeEventListener = () => {}
globalThis.document = {
  addEventListener() {}, removeEventListener() {},
  createElement() { return { style: {}, setAttribute() {}, appendChild() {} } },
  head: {}, body: {}, documentElement: {}, querySelector() { return null }
}
const _s = new Map()
globalThis.localStorage = {
  getItem: (k) => (_s.has(k) ? _s.get(k) : null),
  setItem: (k, v) => _s.set(k, String(v)),
  removeItem: (k) => _s.delete(k),
  clear: () => _s.clear()
}
try {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { href: 'http://localhost/', hash: '', pathname: '/', search: '', origin: 'http://localhost' }
  })
} catch (e) {
  globalThis.location = { href: 'http://localhost/', hash: '', pathname: '/', search: '', origin: 'http://localhost' }
}
_s.set('shiguang_session', JSON.stringify({
  account: 'demo', token: 'x', loginAt: Date.now(), expireAt: Date.now() + 1e12
}))

const ROOT = 'D:/workSpace/ww/java-main2/shiguang-food-login'
const server = await createServer({
  root: ROOT,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
  ssr: { external: ['vue', 'vue-router'] }
})

const require = createRequire(import.meta.url)
const { createSSRApp, h } = require('vue')
const { renderToString } = require('vue/server-renderer')
const { createRouter, createMemoryHistory } = require('vue-router')

const views = [
  '/src/views/HomeView.vue',
  '/src/views/FoodView.vue',
  '/src/views/RestaurantView.vue',
  '/src/views/OrderView.vue',
  '/src/views/OrdersView.vue',
  '/src/views/ProfileView.vue',
  '/src/views/OrderDetailView.vue',
  '/src/views/LoginView.vue',
  '/src/views/EntryView.vue',
  '/src/views/RegisterView.vue',
  '/src/views/ForgotView.vue'
]

let anyFail = false
for (const vf of views) {
  try {
    const view = (await server.ssrLoadModule(vf)).default
    const tr = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: view }] })
    const app = createSSRApp(view)
    app.use(tr)
    tr.push('/')
    await tr.isReady()
    const html = await renderToString(app)
    console.log('OK   ', vf.split('/').pop(), '  len=' + html.length)
  } catch (e) {
    anyFail = true
    console.log('FAIL ', vf.split('/').pop(), ' -> ', e && e.message ? e.message : e)
    console.log((e && e.stack ? e.stack : '').split('\n').slice(0, 6).join('\n'))
    console.log('------')
  }
}
console.log(anyFail ? 'RESULT: 有运行时错误' : 'RESULT: 全部页面 setup/渲染通过，无运行时崩溃')
await server.close()
