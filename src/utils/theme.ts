/**
 * 主题工具
 * 定义 CSS 自定义属性（变量）的键与类型，供换肤使用。
 *
 * 说明：uni-app 中 SCSS 变量是编译期常量，无法在运行时更换。
 * 因此主题色统一改用 CSS 自定义属性（--theme-*），通过页面根容器
 * 的 :style 内联样式注入，从而实现跨端（小程序/H5）的运行时换肤。
 */

/** CSS 变量名 */
export const THEME_CSS_VARS = {
    primary: '--theme-primary',
    primaryLight: '--theme-primary-light',
    primaryBg: '--theme-primary-bg',
    primaryGradStart: '--theme-primary-grad-start',
    primaryGradEnd: '--theme-primary-grad-end',
} as const

export type ThemeCssVars = Record<typeof THEME_CSS_VARS[keyof typeof THEME_CSS_VARS], string>

/**
 * 根据主色生成一组主题 CSS 变量
 * @param primary 主色 hex，如 #ff6b35
 * @param light 浅色 accent（渐变色终点），不传则自动按主色计算
 */
export function buildThemeCssVars(primary: string, light?: string): ThemeCssVars {
    return {
        [THEME_CSS_VARS.primary]: primary,
        [THEME_CSS_VARS.primaryLight]: light ?? lightenColor(primary),
        [THEME_CSS_VARS.primaryBg]: hexToRgba(primary, 0.1),
        [THEME_CSS_VARS.primaryGradStart]: primary,
        [THEME_CSS_VARS.primaryGradEnd]: light ?? lightenColor(primary),
    }
}

/** 将 hex 颜色转换为带透明度的 rgba */
export function hexToRgba(hex: string, alpha: number): string {
    const { r, g, b } = parseHex(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 将 hex 颜色按比例变浅（用于渐变终点/浅色背景） */
export function lightenColor(hex: string, ratio = 0.3): string {
    const { r, g, b } = parseHex(hex)
    const lighter = (c: number) => Math.round(c + (255 - c) * ratio)
    return `#${toHex(lighter(r))}${toHex(lighter(g))}${toHex(lighter(b))}`
}

function parseHex(hex: string): { r: number; g: number; b: number } {
    let normalized = hex.replace('#', '')
    if (normalized.length === 3) {
        normalized = normalized
            .split('')
            .map(c => c + c)
            .join('')
    }
    const num = parseInt(normalized, 16)
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    }
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0')
}
