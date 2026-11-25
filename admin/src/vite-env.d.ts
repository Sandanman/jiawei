/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** API 代理目标（仅开发环境使用，见 vite.config.ts） */
    readonly VITE_API_PROXY_TARGET?: string
    /** API 基础路径，默认 /api/admin */
    readonly VITE_API_BASE?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
