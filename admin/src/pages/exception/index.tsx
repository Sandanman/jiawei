import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

interface ExceptionPageProps {
    code?: '403' | '404'
}

/** 异常页：403 / 404 */
export default function ExceptionPage({ code = '404' }: ExceptionPageProps) {
    const navigate = useNavigate()

    const title = code === '403' ? '无访问权限' : '页面不存在'
    const subTitle = code === '403' ? '当前账号无权访问该页面' : '请检查地址是否正确'

    return (
        <Result
            status={code}
            title={title}
            subTitle={subTitle}
            extra={
                <Button type="primary" onClick={() => navigate('/', { replace: true })}>
                    返回首页
                </Button>
            }
        />
    )
}
