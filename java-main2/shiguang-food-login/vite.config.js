import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
    // 启动后自动在默认浏览器弹出登录页（hash 路由下实际地址为 /#/login）
    open: 'http://localhost:5173/#/login',
    // 开发环境代理：前端 /api/** 请求转发到本地 Spring Boot 后端（端口 8081）
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})
