import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, type MenuProps } from 'antd'
import { DownOutlined, KeyOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { MENU_ITEMS, getRouteTitle } from '../../router/routes'
import { useAuth } from '../../stores/auth-store'
import styles from './index.module.scss'

const { Sider, Header, Content } = Layout

/** 后台主版式：左侧菜单 + 顶栏 + 内容区 */
export default function BasicLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const { admin, logout } = useAuth()

    const segments = location.pathname.split('/').filter(Boolean)
    const rootPath = `/${segments[0] || ''}`

    const breadcrumbItems = useMemo(() => {
        const items: Array<{ title: string }> = [{ title: '首页' }]
        const title = getRouteTitle(rootPath)
        if (title) items.push({ title })
        if (segments.length > 1 && segments[0] !== 'change-password') {
            items.push({ title: '详情' })
        }
        return items
    }, [rootPath, segments.length])

    const userMenuItems: MenuProps['items'] = [
        { key: 'change-password', icon: <KeyOutlined />, label: '修改密码' },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true }
    ]

    const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'logout') {
            logout()
            navigate('/login', { replace: true })
            return
        }
        if (key === 'change-password') {
            navigate('/change-password')
        }
    }

    return (
        <Layout className={styles.layout}>
            <Sider width={208} className={styles.sider} theme="dark">
                <div className={styles.logo}>
                    <span className={styles.logoMark}>家</span>
                    <span>家味小札</span>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    items={MENU_ITEMS}
                    selectedKeys={[rootPath]}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>
            <Layout>
                <Header className={styles.header}>
                    <Breadcrumb items={breadcrumbItems} />
                    <div className={styles.headerRight}>
                        <Dropdown
                            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                            placement="bottomRight"
                        >
                            <span className={styles.adminTrigger}>
                                <Avatar size={28} icon={<UserOutlined />} />
                                <span>{admin?.nickname || admin?.username || '管理员'}</span>
                                <DownOutlined style={{ fontSize: 10 }} />
                            </span>
                        </Dropdown>
                    </div>
                </Header>
                <Content className={styles.content}>
                    <div className={styles.contentInner}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}
