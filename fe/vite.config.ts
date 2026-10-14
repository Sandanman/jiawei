import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
    plugins: [uni()],
    server: {
        host: '127.0.0.1',
        port: 5173,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
})