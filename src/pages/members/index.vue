<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-left">
                <text class="page-title">成员管理</text>
                <text class="page-subtitle">管理家庭成员</text>
            </view>
            <view class="add-btn" @tap="handleShowInvite">
                <text>+ 邀请成员</text>
            </view>
        </view>

        <!-- 成员列表 -->
        <view class="members-list">
            <view
                v-for="member in members"
                :key="member.id"
                class="member-card"
                :class="{ owner: member.role === 'owner' }"
                @tap="handleMemberDetail(member)"
            >
                <view class="member-avatar">
                    <image
                        class="avatar-img"
                        :src="member.avatar || '/static/default-avatar.svg'"
                        mode="aspectFill"
                    />
                    <view v-if="member.role === 'owner'" class="role-icon">
                        <text>👑</text>
                    </view>
                </view>
                <view class="member-info">
                    <view class="member-name-row">
                        <text class="member-name">{{ member.nickname }}</text>
                        <view class="member-role" :class="member.role">
                            <text>{{ getRoleLabel(member.role) }}</text>
                        </view>
                    </view>
                    <text class="member-remark">{{ member.adminRemark || '暂无备注' }}</text>
                    <view class="member-meta">
                        <view class="meta-item">
                            <text>⭐ {{ member.points }}积分</text>
                        </view>
                        <view class="meta-item">
                            <text>📋 {{ member.taskCount }}任务</text>
                        </view>
                        <view class="meta-item">
                            <text>🛒 {{ member.orderCount }}订单</text>
                        </view>
                    </view>
                </view>
                <!-- 管理员操作按钮 -->
                <view v-if="canManageMember(member)" class="member-actions" @tap.stop>
                    <view class="action-btn" @tap="handleEditMember(member)">
                        <text>编辑</text>
                    </view>
                    <view class="action-btn delete" @tap="handleRemoveMember(member)">
                        <text>移除</text>
                    </view>
                </view>
            </view>

            <view v-if="members.length === 0" class="empty-state">
                <text class="empty-icon">👥</text>
                <text class="empty-text">暂无家庭成员</text>
                <text class="empty-hint">点击右上角邀请成员加入</text>
            </view>
        </view>

        <!-- 成员详情弹窗 -->
        <view v-if="showDetailModal" class="modal-overlay" @tap="handleCloseDetail">
            <view class="modal-content detail-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">成员详情</text>
                    <text class="modal-close" @tap="handleCloseDetail">×</text>
                </view>
                <scroll-view scroll-y class="modal-body">
                    <!-- 基本信息 -->
                    <view class="member-header">
                        <image
                            class="detail-avatar"
                            :src="selectedMember?.avatar || '/static/default-avatar.svg'"
                            mode="aspectFill"
                        />
                        <view class="detail-info">
                            <text class="detail-name">{{ selectedMember?.nickname }}</text>
                            <view class="detail-role" :class="selectedMember?.role">
                                <text>{{ getRoleLabel(selectedMember?.role || 'member') }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 统计卡片 -->
                    <view class="stats-cards">
                        <view class="stats-card">
                            <text class="stats-value">{{ selectedMember?.points || 0 }}</text>
                            <text class="stats-label">总积分</text>
                        </view>
                        <view class="stats-card">
                            <text class="stats-value">{{ memberTasks.length }}</text>
                            <text class="stats-label">完成任务</text>
                        </view>
                        <view class="stats-card">
                            <text class="stats-value">{{ memberOrders.length }}</text>
                            <text class="stats-label">历史订单</text>
                        </view>
                    </view>

                    <!-- 标签页 -->
                    <view class="detail-tabs">
                        <view
                            v-for="tab in detailTabs"
                            :key="tab.key"
                            class="detail-tab"
                            :class="{ active: currentDetailTab === tab.key }"
                            @tap="currentDetailTab = tab.key"
                        >
                            <text>{{ tab.label }}</text>
                        </view>
                    </view>

                    <!-- 任务详情 -->
                    <view v-if="currentDetailTab === 'tasks'" class="detail-content">
                        <view
                            v-for="task in memberTasks"
                            :key="task.id"
                            class="task-item"
                            :class="task.status"
                        >
                            <view class="task-info">
                                <text class="task-title">{{ task.title }}</text>
                                <text class="task-meta">{{ task.category }} · {{ task.points }}积分</text>
                            </view>
                            <view class="task-status" :class="task.status">
                                <text>{{ task.statusLabel }}</text>
                            </view>
                        </view>
                        <view v-if="memberTasks.length === 0" class="content-empty">
                            <text>暂无任务记录</text>
                        </view>
                    </view>

                    <!-- 积分详情 -->
                    <view v-if="currentDetailTab === 'points'" class="detail-content">
                        <view
                            v-for="record in memberPointsRecords"
                            :key="record.id"
                            class="record-item"
                            :class="record.type"
                        >
                            <view class="record-info">
                                <text class="record-action">{{ record.action }}</text>
                                <text class="record-time">{{ record.time }}</text>
                            </view>
                            <text class="record-change" :class="record.type">
                                {{ record.type === 'add' ? '+' : '-' }}{{ record.points }}
                            </text>
                        </view>
                        <view v-if="memberPointsRecords.length === 0" class="content-empty">
                            <text>暂无积分记录</text>
                        </view>
                    </view>

                    <!-- 订单详情 -->
                    <view v-if="currentDetailTab === 'orders'" class="detail-content">
                        <view
                            v-for="order in memberOrders"
                            :key="order.id"
                            class="order-item"
                        >
                            <view class="order-info">
                                <text class="order-title">{{ order.title }}</text>
                                <text class="order-meta">{{ order.date }} · {{ order.items }}件商品</text>
                            </view>
                            <view class="order-right">
                                <text class="order-amount">¥{{ order.amount }}</text>
                                <text class="order-status" :class="order.status">{{ order.statusLabel }}</text>
                            </view>
                        </view>
                        <view v-if="memberOrders.length === 0" class="content-empty">
                            <text>暂无订单记录</text>
                        </view>
                    </view>
                </scroll-view>
                <view class="modal-footer">
                    <view class="modal-btn" @tap="handleCloseDetail">
                        <text>关闭</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 邀请成员弹窗 -->
        <view v-if="showInviteModal" class="modal-overlay" @tap="handleCloseInvite">
            <view class="modal-content invite-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">邀请成员</text>
                    <text class="modal-close" @tap="handleCloseInvite">×</text>
                </view>
                <view class="modal-body">
                    <view class="invite-tabs">
                        <view
                            class="invite-tab"
                            :class="{ active: inviteType === 'code' }"
                            @tap="inviteType = 'code'"
                        >
                            <text>邀请码</text>
                        </view>
                        <view
                            class="invite-tab"
                            :class="{ active: inviteType === 'mobile' }"
                            @tap="inviteType = 'mobile'"
                        >
                            <text>手机号</text>
                        </view>
                    </view>

                    <!-- 邀请码方式 -->
                    <view v-if="inviteType === 'code'" class="invite-content">
                        <view class="invite-code-box">
                            <text class="invite-code">{{ inviteCode }}</text>
                        </view>
                        <text class="invite-desc">将此邀请码发送给好友，好友输入即可加入家庭</text>
                        <view class="invite-actions">
                            <view class="invite-btn" @tap="handleCopyCode">
                                <text>复制邀请码</text>
                            </view>
                            <view class="invite-btn secondary" @tap="handleRefreshCode">
                                <text>刷新</text>
                            </view>
                        </view>
                    </view>

                    <!-- 手机号方式 -->
                    <view v-else class="invite-content">
                        <view class="form-item">
                            <text class="form-label">手机号</text>
                            <input
                                v-model="inviteMobile"
                                class="form-input"
                                type="number"
                                placeholder="请输入被邀请人手机号"
                                maxlength="11"
                            />
                        </view>
                        <view class="form-item">
                            <text class="form-label">备注（可选）</text>
                            <input
                                v-model="inviteRemark"
                                class="form-input"
                                placeholder="填写备注方便识别"
                                maxlength="20"
                            />
                        </view>
                        <view class="invite-actions">
                            <view class="invite-btn full" @tap="handleSendInvite">
                                <text>发送邀请</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 编辑成员弹窗 -->
        <view v-if="showEditModal" class="modal-overlay" @tap="handleCloseEdit">
            <view class="modal-content edit-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">编辑成员</text>
                    <text class="modal-close" @tap="handleCloseEdit">×</text>
                </view>
                <view class="modal-body">
                    <view class="form-item">
                        <text class="form-label">成员备注</text>
                        <input
                            v-model="editForm.adminRemark"
                            class="form-input"
                            placeholder="请输入成员备注（仅管理员可见）"
                            maxlength="20"
                        />
                    </view>
                    <view v-if="canChangeRole(selectedMember!)" class="form-item">
                        <text class="form-label">成员角色</text>
                        <view class="role-select">
                            <view
                                class="role-option"
                                :class="{ active: editForm.role === 'admin' }"
                                @tap="editForm.role = 'admin'"
                            >
                                <text>管理员</text>
                            </view>
                            <view
                                class="role-option"
                                :class="{ active: editForm.role === 'member' }"
                                @tap="editForm.role = 'member'"
                            >
                                <text>普通成员</text>
                            </view>
                        </view>
                    </view>
                </view>
                <view class="modal-footer">
                    <view class="modal-btn cancel" @tap="handleCloseEdit">
                        <text>取消</text>
                    </view>
                    <view class="modal-btn confirm" @tap="handleSaveMember">
                        <text>保存</text>
                    </view>
                </view>
            </view>
        </view>

        <CustomTabBar />
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import CustomTabBar from '@/components/custom-tab-bar/index.vue'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 是否是管理员
const isAdmin = computed(() => userStore.isAdmin())

// 成员列表
interface Member {
    id: string
    nickname: string
    avatar: string
    adminRemark: string
    role: 'owner' | 'admin' | 'member'
    points: number
    taskCount: number
    orderCount: number
    joinedAt: string
}

const members = ref<Member[]>([
    { id: '1', nickname: '张三', avatar: '', adminRemark: '爸爸', role: 'owner', points: 850, taskCount: 28, orderCount: 15, joinedAt: '2025-01-01' },
    { id: '2', nickname: '李四', avatar: '', adminRemark: '妈妈', role: 'admin', points: 620, taskCount: 22, orderCount: 12, joinedAt: '2025-01-01' },
    { id: '3', nickname: '小华', avatar: '', adminRemark: '儿子', role: 'member', points: 450, taskCount: 15, orderCount: 8, joinedAt: '2025-02-15' },
    { id: '4', nickname: '小丽', avatar: '', adminRemark: '女儿', role: 'member', points: 380, taskCount: 12, orderCount: 6, joinedAt: '2025-02-15' },
])

// 详情标签页
const detailTabs = [
    { key: 'tasks', label: '任务' },
    { key: 'points', label: '积分' },
    { key: 'orders', label: '订单' },
]
const currentDetailTab = ref('tasks')

// 成员任务详情
const memberTasks = ref([
    { id: '1', title: '准备晚餐', category: '做饭', points: 50, status: 'completed', statusLabel: '已完成' },
    { id: '2', title: '打扫客厅', category: '打扫', points: 20, status: 'completed', statusLabel: '已完成' },
    { id: '3', title: '洗碗', category: '洗碗', points: 10, status: 'in_progress', statusLabel: '进行中' },
])

// 成员积分记录
const memberPointsRecords = ref([
    { id: '1', action: '完成任务：准备晚餐', points: 50, type: 'add', time: '今天 18:30' },
    { id: '2', action: '完成洗碗任务', points: 20, type: 'add', time: '今天 20:00' },
    { id: '3', action: '超时扣分', points: 10, type: 'subtract', time: '昨天 22:00' },
])

// 成员订单记录
const memberOrders = ref([
    { id: '1', title: '午餐订单', date: '今天 12:30', items: 3, amount: 45.5, status: 'completed', statusLabel: '已完成' },
    { id: '2', title: '晚餐订单', date: '昨天 18:00', items: 5, amount: 89.0, status: 'completed', statusLabel: '已完成' },
    { id: '3', title: '午餐订单', date: '昨天 12:00', items: 2, amount: 32.0, status: 'cancelled', statusLabel: '已取消' },
])

// 弹窗状态
const showDetailModal = ref(false)
const showInviteModal = ref(false)
const showEditModal = ref(false)
const selectedMember = ref<Member | null>(null)

// 邀请相关
const inviteType = ref('code')
const inviteCode = ref(generateInviteCode())
const inviteMobile = ref('')
const inviteRemark = ref('')

// 编辑表单
const editForm = ref({
    adminRemark: '',
    role: 'member',
})

// 检查登录状态
onShow(() => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
    }
    if (!isAdmin.value) {
        uni.showToast({ title: '仅管理员可访问', icon: 'none' })
        setTimeout(() => {
            uni.switchTab({ url: '/pages/profile/index' })
        }, 1000)
    }
})

// 判断是否能管理某个成员
const canManageMember = (member: Member) => {
    if (!isAdmin.value) return false
    // 房主不能被管理
    if (member.role === 'owner') return false
    return true
}

// 判断是否能修改角色
const canChangeRole = (member: Member) => {
    if (!isAdmin.value) return false
    if (member.role === 'owner') return false
    return true
}

// 获取角色标签
const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
        owner: '房主',
        admin: '管理员',
        member: '成员',
    }
    return labels[role] || '成员'
}

// 生成邀请码
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// 打开成员详情
const handleMemberDetail = (member: Member) => {
    selectedMember.value = member
    currentDetailTab.value = 'tasks'
    showDetailModal.value = true
}

// 关闭详情
const handleCloseDetail = () => {
    showDetailModal.value = false
    selectedMember.value = null
}

// 打开邀请弹窗
const handleShowInvite = () => {
    if (!isAdmin.value) {
        uni.showToast({ title: '仅管理员可邀请', icon: 'none' })
        return
    }
    inviteCode.value = generateInviteCode()
    inviteMobile.value = ''
    inviteRemark.value = ''
    inviteType.value = 'code'
    showInviteModal.value = true
}

// 关闭邀请弹窗
const handleCloseInvite = () => {
    showInviteModal.value = false
}

// 复制邀请码
const handleCopyCode = () => {
    uni.setClipboardData({
        data: inviteCode.value,
        success: () => {
            uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
        },
    })
}

// 刷新邀请码
const handleRefreshCode = () => {
    inviteCode.value = generateInviteCode()
}

// 发送邀请
const handleSendInvite = () => {
    if (!inviteMobile.value || inviteMobile.value.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
    }
    uni.showToast({ title: '邀请已发送', icon: 'success' })
    handleCloseInvite()
}

// 打开编辑弹窗
const handleEditMember = (member: Member) => {
    selectedMember.value = member
    editForm.value = {
        adminRemark: member.adminRemark,
        role: member.role,
    }
    showEditModal.value = true
}

// 关闭编辑弹窗
const handleCloseEdit = () => {
    showEditModal.value = false
    selectedMember.value = null
}

// 保存成员修改
const handleSaveMember = () => {
    if (!selectedMember.value) return

    const index = members.value.findIndex(m => m.id === selectedMember.value!.id)
    if (index !== -1) {
        members.value[index].adminRemark = editForm.value.adminRemark
        if (canChangeRole(selectedMember.value)) {
            members.value[index].role = editForm.value.role as 'admin' | 'member'
        }
        uni.showToast({ title: '保存成功', icon: 'success' })
    }
    handleCloseEdit()
}

// 移除成员
const handleRemoveMember = (member: Member) => {
    uni.showModal({
        title: '确认移除',
        content: `确定要将 "${member.nickname}" 从家庭中移除吗？`,
        success: (res) => {
            if (res.confirm) {
                const index = members.value.findIndex(m => m.id === member.id)
                if (index !== -1) {
                    members.value.splice(index, 1)
                    uni.showToast({ title: '成员已移除', icon: 'success' })
                }
            }
        },
    })
}
</script>

<style scoped lang="scss">
.container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 120rpx;
}

// 页面头部
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
}

.page-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
    display: block;
}

.page-subtitle {
    font-size: 24rpx;
    color: #999;
}

.add-btn {
    padding: 16rpx 28rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 24rpx;
    font-size: 26rpx;
}

// 成员列表
.members-list {
    padding: 0 24rpx;
}

.member-card {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;

    &.owner {
        border-left: 6rpx solid var(--theme-primary);
    }
}

.member-avatar {
    position: relative;
    margin-right: 20rpx;
}

.avatar-img {
    width: 88rpx;
    height: 88rpx;
    border-radius: 44rpx;
    background-color: #f0f0f0;
}

.role-icon {
    position: absolute;
    bottom: -4rpx;
    right: -4rpx;
    font-size: 24rpx;
}

.member-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.member-name-row {
    display: flex;
    align-items: center;
    margin-bottom: 6rpx;
}

.member-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-right: 12rpx;
}

.member-role {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 20rpx;

    &.owner {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
    }

    &.admin {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    &.member {
        background-color: #f5f5f5;
        color: #666;
    }
}

.member-remark {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
}

.member-meta {
    display: flex;
    gap: 16rpx;
}

.meta-item {
    font-size: 22rpx;
    color: #999;
}

.member-actions {
    display: flex;
    gap: 12rpx;
}

.action-btn {
    padding: 12rpx 20rpx;
    background-color: #f5f5f5;
    border-radius: 8rpx;
    font-size: 24rpx;
    color: #666;

    &.delete {
        background-color: #ffebee;
        color: #f44336;
    }
}

// 空状态
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 100rpx 0;
}

.empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 12rpx;
}

.empty-hint {
    font-size: 24rpx;
    color: #999;
}

// 弹窗
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
}

.detail-modal,
.invite-modal,
.edit-modal {
    width: 100%;
    max-height: 85vh;
    background-color: #fff;
    border-radius: 32rpx 32rpx 0 0;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.modal-close {
    font-size: 48rpx;
    color: #999;
    line-height: 1;
}

.modal-body {
    padding: 24rpx 32rpx;
    max-height: 60vh;
}

.modal-footer {
    padding: 24rpx 32rpx;
    border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
    padding: 24rpx 0;
    text-align: center;
    border-radius: 40rpx;
    font-size: 30rpx;
    background-color: #f5f5f5;
    color: #666;

    &.cancel {
        background-color: #f5f5f5;
        color: #666;
    }

    &.confirm {
        background-color: var(--theme-primary);
        color: #fff;
    }
}

// 详情弹窗内容
.member-header {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
}

.detail-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50rpx;
    margin-right: 20rpx;
    background-color: #f0f0f0;
}

.detail-info {
    display: flex;
    flex-direction: column;
}

.detail-name {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
}

.detail-role {
    display: inline-flex;
    padding: 6rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    align-self: flex-start;

    &.owner {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
    }

    &.admin {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    &.member {
        background-color: #f5f5f5;
        color: #666;
    }
}

// 统计卡片
.stats-cards {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.stats-card {
    flex: 1;
    background-color: #f9f9f9;
    border-radius: 12rpx;
    padding: 20rpx;
    text-align: center;
}

.stats-value {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--theme-primary);
    display: block;
}

.stats-label {
    font-size: 22rpx;
    color: #999;
}

// 详情标签页
.detail-tabs {
    display: flex;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    padding: 6rpx;
    margin-bottom: 20rpx;
}

.detail-tab {
    flex: 1;
    text-align: center;
    padding: 14rpx 0;
    font-size: 26rpx;
    color: #666;
    border-radius: 8rpx;

    &.active {
        background-color: #fff;
        color: var(--theme-primary);
        font-weight: bold;
    }
}

// 详情内容
.detail-content {
    // empty
}

.task-item,
.record-item,
.order-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
}

.task-info,
.record-info,
.order-info {
    flex: 1;
}

.task-title,
.record-action,
.order-title {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 6rpx;
    display: block;
}

.task-meta,
.record-time,
.order-meta {
    font-size: 22rpx;
    color: #999;
}

.task-status {
    padding: 6rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;

    &.completed {
        background-color: #e8f5e9;
        color: #4caf50;
    }

    &.in_progress {
        background-color: #fff3e0;
        color: #f0ad4e;
    }
}

.record-change {
    font-size: 28rpx;
    font-weight: bold;

    &.add {
        color: #4caf50;
    }

    &.subtract {
        color: #f44336;
    }
}

.order-right {
    text-align: right;
}

.order-amount {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 4rpx;
}

.order-status {
    font-size: 22rpx;

    &.completed {
        color: #4caf50;
    }

    &.cancelled {
        color: #999;
    }
}

.content-empty {
    text-align: center;
    padding: 60rpx 0;
    color: #999;
    font-size: 26rpx;
}

// 邀请弹窗内容
.invite-tabs {
    display: flex;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    padding: 6rpx;
    margin-bottom: 24rpx;
}

.invite-tab {
    flex: 1;
    text-align: center;
    padding: 14rpx 0;
    font-size: 28rpx;
    color: #666;
    border-radius: 8rpx;

    &.active {
        background-color: #fff;
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.invite-content {
    // empty
}

.invite-code-box {
    background-color: var(--theme-primary-bg);
    border-radius: 16rpx;
    padding: 40rpx;
    text-align: center;
    margin-bottom: 20rpx;
}

.invite-code {
    font-size: 48rpx;
    font-weight: bold;
    color: var(--theme-primary);
    letter-spacing: 8rpx;
}

.invite-desc {
    font-size: 26rpx;
    color: #999;
    text-align: center;
    display: block;
    margin-bottom: 24rpx;
}

.invite-actions {
    display: flex;
    gap: 16rpx;
}

.invite-btn {
    flex: 1;
    padding: 24rpx 0;
    text-align: center;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;

    &.secondary {
        background-color: #f5f5f5;
        color: #666;
    }

    &.full {
        flex: unset;
        width: 100%;
    }
}

// 编辑弹窗内容
.form-item {
    margin-bottom: 24rpx;
}

.form-label {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.form-input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
}

.role-select {
    display: flex;
    gap: 16rpx;
}

.role-option {
    flex: 1;
    padding: 20rpx 0;
    text-align: center;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #666;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}
</style>