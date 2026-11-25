/**
 * 设计令牌单一来源
 * - 同时供 antd ConfigProvider（theme/antd-theme.ts）
 * - 与 CSS 变量（theme/apply-tokens.ts → --admin-*）
 * 使用，避免两处数值漂移。品牌色沿用小程序 fe/src/uni.scss。
 */

export const designTokens = {
    color: {
        primary: '#ff6b35',
        primaryHover: '#ff8555',
        primaryActive: '#e85a2a',
        primaryLight: '#fff3ee',
        success: '#4cd964',
        warning: '#f0ad4e',
        danger: '#dd524d',
        info: '#1890ff',
        pageBg: '#f8f8f8',
        cardBg: '#ffffff',
        tableHeader: '#fafafa',
        border: '#e5e5e5',
        text: '#333333',
        textSecondary: '#999999',
        siderBg: '#1f2329'
    },
    radius: {
        sm: 4,
        md: 8,
        lg: 12
    },
    shadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 6px 16px rgba(0, 0, 0, 0.08)'
    },
    font: {
        titleSize: 20,
        titleLineHeight: 28,
        cardTitleSize: 16,
        cardTitleLineHeight: 24,
        bodySize: 14,
        bodyLineHeight: 22,
        auxSize: 12,
        auxLineHeight: 20
    },
    space: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        pagePadding: 24,
        cardGap: 16
    }
} as const
