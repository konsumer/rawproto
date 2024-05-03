import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      rawproto: path.resolve(__dirname, 'src/index.js')
    }
  }
})
