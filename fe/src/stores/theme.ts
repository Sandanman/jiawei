/**
 * 主题状态管理
 * 负责主题色预设、本地持久化与切换。仅支持个人偏好（本地存储）。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { buildThemeCssVars } from '@/utils/theme'
import type { ThemeCssVars } from '@/utils/theme'

/** 本地存储 key */
const STORAGE_KEY = 'themeColor'

/** 内置主题预设（含默认橙） */
export interface ThemePreset {
    name: string
    color: string
}

export const THEME_PRESETS: ThemePreset[] = [
    { name: '活力橙', color: '#ff6b35' },
    { name: '清新绿', color: '#07c160' },
    { name: '海盐蓝', color: '#3b7cff' },
    { name: '浪漫粉', color: '#ff6b9d' },
    { name: '暖阳黄', color: '#f5a623' },
    { name: '高贵紫', color: '#7b5cff' },
]

export const useThemeStore = defineStore('theme', () => {
    /** 当前主题主色 */
    const color = ref<string>(THEME_PRESETS[0].color)

    /** 当前主题对应的 CSS 变量集合（注入到页面根容器 :style） */
    const cssVars = computed<ThemeCssVars>(() => buildThemeCssVars(color.value))

    /** 从本地存储恢复主题 */
    function init() {
        try {
            const saved = uni.getStorageSync(STORAGE_KEY)
            if (saved && typeof saved === 'string') {
                color.value = saved
            }
        } catch (e) {
            console.warn('[theme] init failed', e)
        }
    }

    /** 切换主题并持久化 */
    function setColor(next: string) {
        color.value = next
        try {
            uni.setStorageSync(STORAGE_KEY, next)
        } catch (e) {
            console.warn('[theme] persist failed', e)
        }
    }

    return {
        color,
        cssVars,
        init,
        setColor,
    }
})
