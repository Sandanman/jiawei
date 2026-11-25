/**
 * 将设计令牌写入根节点 CSS 变量（--admin-*）
 * CSS Modules 通过 var(--admin-*) 取值，保证与 antd 主题同源
 */
import { designTokens } from './tokens'

export function applyTokens(): void {
    const root = document.documentElement
    const { color, radius, shadow, font, space } = designTokens

    const vars: Record<string, string | number> = {
        '--admin-color-primary': color.primary,
        '--admin-color-primary-hover': color.primaryHover,
        '--admin-color-primary-active': color.primaryActive,
        '--admin-color-primary-light': color.primaryLight,
        '--admin-color-success': color.success,
        '--admin-color-warning': color.warning,
        '--admin-color-danger': color.danger,
        '--admin-color-info': color.info,
        '--admin-page-bg': color.pageBg,
        '--admin-card-bg': color.cardBg,
        '--admin-table-header': color.tableHeader,
        '--admin-border': color.border,
        '--admin-text': color.text,
        '--admin-text-secondary': color.textSecondary,
        '--admin-sider-bg': color.siderBg,
        '--admin-radius-sm': `${radius.sm}px`,
        '--admin-radius-md': `${radius.md}px`,
        '--admin-radius-lg': `${radius.lg}px`,
        '--admin-shadow-sm': shadow.sm,
        '--admin-shadow-md': shadow.md,
        '--admin-font-title-size': `${font.titleSize}px`,
        '--admin-font-title-line': `${font.titleLineHeight}px`,
        '--admin-font-card-title-size': `${font.cardTitleSize}px`,
        '--admin-font-card-title-line': `${font.cardTitleLineHeight}px`,
        '--admin-font-body-size': `${font.bodySize}px`,
        '--admin-font-body-line': `${font.bodyLineHeight}px`,
        '--admin-font-aux-size': `${font.auxSize}px`,
        '--admin-font-aux-line': `${font.auxLineHeight}px`,
        '--admin-space-xs': `${space.xs}px`,
        '--admin-space-sm': `${space.sm}px`,
        '--admin-space-md': `${space.md}px`,
        '--admin-space-lg': `${space.lg}px`,
        '--admin-space-xl': `${space.xl}px`,
        '--admin-space-page': `${space.pagePadding}px`,
        '--admin-space-card-gap': `${space.cardGap}px`
    }

    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, String(value))
    }
}
