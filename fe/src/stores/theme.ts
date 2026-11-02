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

/** 内置主题预设（含默认绿） */
export interface ThemePreset {
    name: string
    color: string
}

export const THEME_PRESETS: ThemePreset[] = [
    { name: '胭脂红', color: '#9d1f2f' },
    { name: '蕉红', color: '#d4042d' },
    { name: '活力橙', color: '#ff6b35' },
    { name: '火星橙', color: '#eb6127' },
    { name: '暖阳橙', color: '#db7a0e' },
    { name: '枫叶橙', color: '#f6ab00' },
    { name: '暖阳黄', color: '#f5a623' },
    { name: '柠檬黄', color: '#faca2e' },
    { name: '清新绿', color: '#07c160' },
    { name: '春叶绿', color: '#6fba2c' },
    { name: '翠微', color: '#5e8034' },
    { name: '星灰绿', color: '#003d37' },
    { name: '碧青', color: '#41b5c2' },
    { name: '天青', color: '#7ec8e3' },
    { name: '雾霾蓝', color: '#8ca6c1' },
    { name: '湖蓝', color: '#2e9cca' },
    { name: '矢车菊蓝', color: '#5a92e5' },
    { name: '海盐蓝', color: '#3b7cff' },
    { name: '孔雀蓝', color: '#006d77' },
    { name: '中国蓝', color: '#365194' },
    { name: '宝石蓝', color: '#0f52ba' },
    { name: '洒蓝', color: '#182876' },
    { name: '克莱因蓝', color: '#002fa7' },
    { name: '普鲁士蓝', color: '#003153' },
    { name: '高贵紫', color: '#7b5cff' },
    { name: '晶石紫', color: '#690dad' },
    { name: '皇家紫', color: '#722169' },
    { name: '浪漫粉', color: '#ff6b9d' },
    { name: '梅洛粉', color: '#eb6d98' },
    { name: '霓虹粉', color: '#ea6097' },
]

export const useThemeStore = defineStore('theme', () => {
    /** 当前主题主色（默认清新绿） */
    const color = ref<string>('#07c160')

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
