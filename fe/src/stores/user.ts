/**
 * 用户状态管理
 * 对接后端 /api/auth 接口
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getProfile as apiGetProfile } from '@/api/auth'
import type { UserInfo, FamilyBrief, FamilyRole } from '@/api/types'

export type UserRole = 'owner' | 'admin' | 'member' | ''

// 兼容旧代码的家庭项类型
export interface FamilyItem {
    familyId: number
    familyName: string
    points: number
    isAdmin: boolean
}

export const useUserStore = defineStore('user', () => {
    // ===== 状态 =====
    const isLogin = ref(false)
    const role = ref<UserRole>('')
    const nickname = ref('')
    const avatar = ref('')
    const familyId = ref<number>(0)
    const userId = ref<number>(0)
    const token = ref('')
    const points = ref(0)
    const phone = ref('')
    const inviteCode = ref('')

    // 多家庭
    const families = ref<FamilyBrief[]>([])
    const currentFamilyIndex = ref(0)

    // ===== 计算属性 =====
    const getCurrentFamily = computed<FamilyBrief | null>(() =>
        families.value[currentFamilyIndex.value] || null
    )

    const getCurrentPoints = computed(() => {
        const fam = getCurrentFamily.value
        return fam ? fam.points : points.value
    })

    // ===== 内部方法 =====
    /** 从后端 LoginResult 填充状态 */
    function applyLoginResult(data: {
        token: string
        user: UserInfo
        families: FamilyBrief[]
    }) {
        token.value = data.token
        userId.value = data.user.id
        nickname.value = data.user.nickname
        avatar.value = data.user.avatar
        phone.value = data.user.phone
        points.value = data.user.points

        families.value = data.families
        currentFamilyIndex.value = 0
        if (data.families.length > 0) {
            familyId.value = data.families[0].familyId
            role.value = data.families[0].role
        } else {
            familyId.value = 0
            role.value = ''
        }

        isLogin.value = true
    }

    // ===== Actions =====

    /** 账号密码登录 */
    async function login(username: string, password: string): Promise<boolean> {
        try {
            const data = await apiLogin(username, password)
            applyLoginResult(data)
            return true
        } catch (err) {
            console.error('[login]', err)
            return false
        }
    }

    /** 拉取并刷新当前用户信息（需已登录） */
    async function fetchProfile(): Promise<void> {
        if (!token.value) return
        const data = await apiGetProfile()
        userId.value = data.id
        nickname.value = data.nickname
        avatar.value = data.avatar
        phone.value = data.phone
        points.value = data.points
        inviteCode.value = data.inviteCode
        if (data.families.length > 0) {
            families.value = data.families
            const idx = families.value.findIndex(f => f.familyId === familyId.value)
            currentFamilyIndex.value = idx >= 0 ? idx : 0
        }
    }

    /** 切换当前家庭 */
    function switchFamily(newFamilyId: number) {
        const index = families.value.findIndex(f => f.familyId === newFamilyId)
        if (index !== -1) {
            currentFamilyIndex.value = index
            familyId.value = newFamilyId
            role.value = families.value[index].role
        }
    }

    /** 退出登录 */
    function logout() {
        isLogin.value = false
        role.value = ''
        nickname.value = ''
        avatar.value = ''
        familyId.value = 0
        userId.value = 0
        token.value = ''
        points.value = 0
        phone.value = ''
        inviteCode.value = ''
        families.value = []
        currentFamilyIndex.value = 0
    }

    // ===== 兼容旧调用 =====
    const isAdmin = () => role.value === 'admin' || role.value === 'owner'
    const isMember = () => role.value === 'member'
    const checkLogin = () => isLogin.value
    const getRole = () => role.value

    function updateCurrentPoints(p: number) {
        points.value = p
        // 同步当前家庭的积分（切换家庭后 getCurrentPoints 取 fam.points）
        const fam = getCurrentFamily.value
        if (fam) fam.points = p
    }

    function updateFamilyName(famId: number, newName: string) {
        const fam = families.value.find(f => f.familyId === famId)
        if (fam) fam.familyName = newName
    }

    return {
        // 状态
        isLogin,
        role,
        nickname,
        avatar,
        familyId,
        userId,
        token,
        points,
        phone,
        inviteCode,
        families,
        currentFamilyIndex,
        // 计算
        getCurrentFamily,
        getCurrentPoints,
        // actions
        login,
        fetchProfile,
        switchFamily,
        logout,
        // 兼容
        checkLogin,
        getRole,
        isAdmin,
        isMember,
        updateCurrentPoints,
        updateFamilyName,
    }
})
