import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'config.json',
          dest: ''
        },
        {
          src: 'date.json',
          dest: ''
        },
        {
          src: 'api',
          dest: ''
        }
      ]
    })
  ],
  // 关键：确保在云端/容器环境中可以正确绑定端口
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: 443 // 尝试强制 HMR 走 HTTPS 端口，防止 WebSocket 连接失败
    }
  },
  base: './', // 相对路径，确保在非根目录部署时资源路径正确
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, 
    minify: 'terser', 
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], 
        },
      },
    },
  },
});