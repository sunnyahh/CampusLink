import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：这里只做两件事
// 1. 启用 Vue 3 单文件组件（.vue）支持
// 2. 固定开发服务器端口，方便你知道打开哪个网址
export default defineConfig({
  base: '/CampusLink/',
  plugins: [vue()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false
  }
})
