/**
 * antd 主题配置：与 designTokens 同源
 */
import type { ThemeConfig } from 'antd'
import { designTokens } from './tokens'

const { color, radius } = designTokens

export const antdTheme: ThemeConfig = {
    token: {
        colorPrimary: color.primary,
        colorSuccess: color.success,
        colorWarning: color.warning,
        colorError: color.danger,
        colorInfo: color.info,
        colorLink: color.primary,
        colorText: color.text,
        colorTextSecondary: color.textSecondary,
        colorBorder: color.border,
        colorBgLayout: color.pageBg,
        borderRadius: radius.md,
        borderRadiusSM: radius.sm,
        borderRadiusLG: radius.lg,
        controlHeight: 32,
        fontSize: 14,
        wireframe: false
    },
    components: {
        Layout: {
            bodyBg: color.pageBg,
            headerBg: color.cardBg,
            siderBg: color.siderBg
        },
        Menu: {
            darkItemBg: color.siderBg,
            darkItemSelectedBg: color.primary,
            darkItemHoverBg: 'rgba(255, 255, 255, 0.08)'
        },
        Table: {
            headerBg: color.tableHeader,
            headerColor: color.text,
            rowHoverBg: color.primaryLight
        },
        Button: {
            primaryShadow: 'none'
        }
    }
}
