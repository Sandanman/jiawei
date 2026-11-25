import { useEffect } from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './stores/auth-store'
import { antdTheme } from './theme/antd-theme'
import { applyTokens } from './theme/apply-tokens'
import { bindMessageApi } from './utils/message'

dayjs.locale('zh-cn')
applyTokens()

/** 把 antd App 的 message 实例交给请求层使用 */
function MessageBridge() {
    const { message } = AntApp.useApp()

    useEffect(() => {
        bindMessageApi(message)
    }, [message])

    return null
}

export function App() {
    return (
        <ConfigProvider locale={zhCN} theme={antdTheme}>
            <AntApp>
                <AuthProvider>
                    <MessageBridge />
                    <RouterProvider router={router} />
                </AuthProvider>
            </AntApp>
        </ConfigProvider>
    )
}
