import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// ============================================================
// 本机局域网 IP（前后端统一使用）
// ------------------------------------------------------------
// 本机以太网地址为 192.168.68.31，前端与后端都以它对外提供服务，
// 局域网内其它设备（手机 / 另一台电脑）可直接访问：
//   前端 http://192.168.68.31:5173/#/login
//   后端 http://192.168.68.31:8081
// 换网络 / 换机器后只需要改这一处（后端 application-dev.properties 的
// server.address 同步改）。
// ============================================================
const LAN_HOST = '192.168.68.31'
const BACKEND_PORT = 8081

export default defineConfig({
  plugins: [vue()],
  server: {
    // 绑定本机 IP：监听 192.168.68.31:5173，局域网内可访问。
    // 若想同时保留 http://localhost:5173 访问，把 host 改成 true（等价 0.0.0.0）。
    host: LAN_HOST,
    port: 5173,
    // 端口被占用时直接报错，避免自动跳到 5174 后代理/文档地址对不上
    strictPort: true,
    // 启动后自动在默认浏览器弹出登录页（hash 路由下实际地址为 /#/login）
    open: `http://${LAN_HOST}:5173/#/login`,
    // 开发环境代理：前端 /api/** 请求转发到本机 Spring Boot 后端（8081）
    proxy: {
      '/api': {
        target: `http://${LAN_HOST}:${BACKEND_PORT}`,
        changeOrigin: true
      }
    }
  }
})
