/**
 * 全局消息桥：拦截器等非组件环境通过它提示
 * 需由 app.tsx 在 antd <App> 上下文中绑定
 */

export interface MessageApi {
    success(content: string): void
    error(content: string): void
    warning(content: string): void
    info(content: string): void
}

let messageApi: MessageApi | null = null

export function bindMessageApi(api: MessageApi): void {
    messageApi = api
}

export function showSuccess(content: string): void {
    messageApi?.success(content)
}

export function showError(content: string): void {
    messageApi?.error(content)
}

export function showWarning(content: string): void {
    messageApi?.warning(content)
}
