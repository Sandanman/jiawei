<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-card">
                <view class="header-content">
                    <view class="family-info">
                        <text class="family-name">{{ currentFamily?.familyName || '我的家庭' }}</text>
                        <text class="family-desc">家庭成员积分一览</text>
                    </view>
                    <view class="total-points">
                        <text class="total-label">总积分</text>
                        <text class="total-value">{{ totalPoints }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 搜索筛选 -->
        <view class="search-section">
            <view class="search-bar">
                <text class="search-icon">🔍</text>
                <input
                    v-model="searchKey"
                    class="search-input"
                    placeholder="搜索成员名称"
                />
            </view>
        </view>

        <!-- 成员积分列表 -->
        <view class="members-list">
            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <template v-else>
                <view
                    v-for="member in filteredMembers"
                    :key="member.userId"
                    class="member-card"
                    @tap="handleMemberDetail(member)"
                >
                    <view class="member-avatar">
                        <image
                            class="avatar-img"
                            :src="member.avatar || '/static/default-avatar.svg'"
                            mode="aspectFill"
                        />
                        <view v-if="member.isOwner" class="owner-badge">
                            <text>房</text>
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
                        <view class="member-joined">
                            <text>加入时间：{{ formatJoinedAt(member.joinedAt) }}</text>
                        </view>
                    </view>
                    <view class="member-points-section">
                        <text class="member-points">{{ member.points }}</text>
                        <text class="member-points-label">积分</text>
                    </view>
                </view>

                <view v-if="filteredMembers.length === 0" class="empty-state">
                    <text class="empty-icon">👥</text>
                    <text class="empty-text">暂无成员数据</text>
                </view>
            </template>
        </view>

        <!-- 成员详情弹窗 -->
        <view v-if="showMemberModal" class="modal-overlay" @tap="handleCloseModal">
            <view class="modal-content member-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">成员详情</text>
                    <text class="modal-close" @tap="handleCloseModal">×</text>
                </view>
                <view class="modal-body">
                    <view class="member-detail-header">
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

                    <view class="detail-section">
                        <view class="detail-row">
                            <text class="detail-label">成员备注</text>
                            <text class="detail-value">{{ selectedMember?.adminRemark || '暂无' }}</text>
                        </view>
                        <view class="detail-row">
                            <text class="detail-label">当前积分</text>
                            <text class="detail-value highlight">{{ selectedMember?.points }}</text>
                        </view>
                        <view class="detail-row">
                            <text class="detail-label">加入时间</text>
                            <text class="detail-value">{{ formatJoinedAt(selectedMember?.joinedAt || '') }}</text>
                        </view>
                    </view>

                    <!-- 积分变动记录 -->
                    <view class="points-history">
                        <text class="history-title">积分变动记录</text>
                        <view v-if="recordsLoading" class="history-empty">
                            <text>加载中...</text>
                        </view>
                        <template v-else>
                            <view
                                v-for="record in memberRecords"
                                :key="record.id"
                                class="history-item"
                            >
                                <view class="history-left">
                                    <text class="history-action">{{ record.description || getTypeLabel(record.type) }}</text>
                                    <text class="history-time">{{ formatTime(record.createdAt) }}</text>
                                </view>
                                <text
                                    class="history-change"
                                    :class="record.pointsChange >= 0 ? 'add' : 'subtract'"
                                >
                                    {{ record.pointsChange >= 0 ? '+' : '' }}{{ record.pointsChange }}
                                </text>
                            </view>
                            <view v-if="memberRecords.length === 0" class="history-empty">
                                <text>暂无记录</text>
                            </view>
                        </template>
                    </view>
                </view>

                <!-- 管理员可手动调整积分 -->
                <view v-if="isAdmin && selectedMember" class="modal-footer">
                    <view class="modal-btn adjust add" @tap="handleAdjust('manual_add')">
                        <text>手动加分</text>
                    </view>
                    <view class="modal-btn adjust subtract" @tap="handleAdjust('manual_subtract')">
                        <text>手动扣分</text>
                    </view>
                </view>
                <view v-else class="modal-footer">
                    <view class="modal-btn cancel" @tap="handleCloseModal">
                        <text>关闭</text>
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
import * as pointsApi from '@/api/points'
import type { PointsSummary, PointsRecord, PointsRecordType, AdjustPointsPayload } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 搜索
const searchKey = ref('')

const members = ref<PointsSummary[]>([])
const loading = ref(false)

// 弹窗状态
const showMemberModal = ref(false)
const selectedMember = ref<PointsSummary | null>(null)
const memberRecords = ref<PointsRecord[]>([])
const recordsLoading = ref(false)

const currentFamily = computed(() => userStore.getCurrentFamily)
const familyId = computed(() => userStore.familyId)
const isAdmin = computed(() => userStore.isAdmin())

const totalPoints = computed(() => members.value.reduce((sum, m) => sum + m.points, 0))

const filteredMembers = computed(() => {
    if (!searchKey.value) return members.value
    const key = searchKey.value
    return members.value.filter(m =>
        m.nickname.includes(key) ||
        (m.adminRemark || '').includes(key)
    )
})

onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    await loadSummaries()
})

async function loadSummaries() {
    if (!familyId.value) return
    loading.value = true
    try {
        members.value = await pointsApi.listPointsSummaries(familyId.value)
    } catch (err) {
        // ignore
    } finally {
        loading.value = false
    }
}

async function loadMemberRecords(userId: number) {
    if (!familyId.value) return
    recordsLoading.value = true
    try {
        memberRecords.value = await pointsApi.listPointsRecords(familyId.value, { userId })
    } catch (err) {
        // ignore
    } finally {
        recordsLoading.value = false
    }
}

const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
        owner: '房主',
        admin: '管理员',
        member: '成员',
    }
    return labels[role] || '成员'
}

const getTypeLabel = (type: PointsRecordType) => {
    const labels: Record<PointsRecordType, string> = {
        order_deduct: '下单扣分',
        task_reward: '任务奖励',
        dish_reward: '菜品奖励',
        manual_add: '手动加分',
        manual_subtract: '手动扣分',
        reward_deduct: '商城兑换',
    }
    return labels[type] || type
}

const formatJoinedAt = (iso: string) => {
    if (!iso) return ''
    return iso.replace('T', ' ').replace(/\..*$/, '').slice(0, 16)
}

const formatTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso.replace(' ', 'T'))
    const now = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return `今天 ${hh}:${mm}`
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}

const handleMemberDetail = async (member: PointsSummary) => {
    selectedMember.value = member
    showMemberModal.value = true
    memberRecords.value = []
    await loadMemberRecords(member.userId)
}

const handleCloseModal = () => {
    showMemberModal.value = false
    selectedMember.value = null
    memberRecords.value = []
}

const handleAdjust = (type: 'manual_add' | 'manual_subtract') => {
    if (!selectedMember.value || !familyId.value) return
    const isAdd = type === 'manual_add'
    const title = isAdd ? '手动加分' : '手动扣分'

    uni.showModal({
        title,
        content: `请输入${isAdd ? '加' : '扣'}减的积分数额`,
        editable: true,
        placeholderText: '请输入正整数',
        success: async (res) => {
            if (!res.confirm) return
            const points = Number(res.content)
            if (!Number.isFinite(points) || points <= 0) {
                uni.showToast({ title: '请输入大于 0 的整数', icon: 'none' })
                return
            }
            try {
                const payload: AdjustPointsPayload = {
                    familyId: familyId.value,
                    userId: selectedMember.value!.userId,
                    points,
                    type,
                }
                await pointsApi.adjustPoints(payload)
                uni.showToast({ title: '调整成功', icon: 'success' })
                // 刷新当前成员的流水
                await loadMemberRecords(selectedMember.value!.userId)
                // 刷新汇总列表，并同步更新 selectedMember
                await loadSummaries()
                const updated = members.value.find(m => m.userId === selectedMember.value!.userId)
                if (updated) selectedMember.value = updated
                // 同步当前登录用户全局积分
                if (selectedMember.value && userStore.userId === selectedMember.value.userId) {
                    userStore.updateCurrentPoints(selectedMember.value.points)
                }
            } catch (err) {
                // ignore
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
    padding: 24rpx;
}

.header-card {
    background: linear-gradient(135deg, var(--theme-primary-grad-start) 0%, var(--theme-primary-grad-end) 100%);
    border-radius: 20rpx;
    padding: 32rpx;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.family-info {
    display: flex;
    flex-direction: column;
}

.family-name {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.family-desc {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
}

.total-points {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.total-label {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 4rpx;
}

.total-value {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
}

// 搜索栏
.search-section {
    padding: 0 24rpx;
    margin-bottom: 20rpx;
}

.search-bar {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 40rpx;
    padding: 16rpx 24rpx;
}

.search-icon {
    font-size: 32rpx;
    margin-right: 12rpx;
}

.search-input {
    flex: 1;
    font-size: 28rpx;
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

.owner-badge {
    position: absolute;
    bottom: -4rpx;
    right: -4rpx;
    width: 32rpx;
    height: 32rpx;
    background-color: var(--theme-primary);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18rpx;
    color: #fff;
    font-weight: bold;
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
    margin-bottom: 4rpx;
}

.member-joined {
    font-size: 22rpx;
    color: #ccc;
}

.member-points-section {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.member-points {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

.member-points-label {
    font-size: 20rpx;
    color: #999;
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
    font-size: 28rpx;
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

.member-modal {
    width: 100%;
    max-height: 80vh;
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

.member-detail-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
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

.detail-section {
    background-color: #f9f9f9;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
        border-bottom: none;
    }
}

.detail-label {
    font-size: 28rpx;
    color: #999;
}

.detail-value {
    font-size: 28rpx;
    color: #333;

    &.highlight {
        color: var(--theme-primary);
        font-weight: bold;
    }
}

// 积分历史
.points-history {
    margin-top: 16rpx;
}

.history-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
    display: block;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
}

.history-left {
    display: flex;
    flex-direction: column;
}

.history-action {
    font-size: 26rpx;
    color: #333;
    margin-bottom: 4rpx;
}

.history-time {
    font-size: 22rpx;
    color: #ccc;
}

.history-change {
    font-size: 28rpx;
    font-weight: bold;

    &.add {
        color: #4caf50;
    }

    &.subtract {
        color: #f44336;
    }
}

.history-empty {
    text-align: center;
    padding: 32rpx 0;
    color: #999;
    font-size: 26rpx;
}

.modal-footer {
    padding: 24rpx 32rpx;
    border-top: 1rpx solid #f0f0f0;
    display: flex;
    gap: 16rpx;
}

.modal-btn {
    flex: 1;
    padding: 24rpx 0;
    text-align: center;
    border-radius: 40rpx;
    font-size: 30rpx;

    &.cancel {
        background-color: #f5f5f5;
        color: #666;
    }

    &.adjust {
        &.add {
            background-color: var(--theme-primary);
            color: #fff;
        }

        &.subtract {
            background-color: #ffebee;
            color: #f44336;
        }
    }
}
</style>
