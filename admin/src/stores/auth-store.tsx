import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from 'react'
import { getMe, login as loginApi } from '../api/auth'
import type { AdminProfile } from '../api/types'
import { clearToken, getToken, setToken } from './token'

interface AuthContextValue {
    admin: AdminProfile | null
    loading: boolean
    login: (username: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** 登录态：token 持久化在 localStorage，刷新后用 /auth/me 校验 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<AdminProfile | null>(null)
    const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()))

    useEffect(() => {
        if (!getToken()) {
            setLoading(false)
            return
        }

        let cancelled = false
        getMe()
            .then(profile => {
                if (!cancelled) setAdmin(profile)
            })
            .catch(() => {
                if (!cancelled) {
                    clearToken()
                    setAdmin(null)
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const login = useCallback(async (username: string, password: string) => {
        const result = await loginApi(username, password)
        setToken(result.token)
        setAdmin({ ...result.admin, lastLoginAt: null })
        setLoading(false)
    }, [])

    const logout = useCallback(() => {
        clearToken()
        setAdmin(null)
    }, [])

    const value = useMemo(
        () => ({ admin, loading, login, logout }),
        [admin, loading, login, logout]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
    return ctx
}
