<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-left">
                <text class="page-title">奖励管理</text>
                <text class="page-subtitle">管理积分商城奖励</text>
            </view>
            <view class="add-btn" @tap="handleShowAddReward">
                <text>+ 添加奖励</text>
            </view>
        </view>

        <!-- 标签页：奖励列表 / 兑换记录 -->
        <view class="tabs-section">
            <view class="tabs">
                <view
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab-item"
                    :class="{ active: currentTab === tab.key }"
                    @tap="handleTabChange(tab.key)"
                >
                    <text>{{ tab.label }}</text>
                </view>
            </view>
        </view>

        <!-- 奖励列表 -->
        <view v-if="currentTab === 'rewards'" class="reward-list">
            <view
                v-for="reward in rewards"
                :key="reward.id"
                class="reward-card"
                :class="{ unpublished: !reward.isPublished }"
            >
                <view class="reward-image-wrap">
                    <image
                        class="reward-img"
                        :src="reward.imageUrl || '/static/default-avatar.svg'"
                        mode="aspectFill"
                    />
                    <view v-if="!reward.isPublished" class="unpublished-tag">
                        <text>已下架</text>
                    </view>
                </view>
                <view class="reward-info">
                    <view class="reward-header">
                        <text class="reward-name">{{ reward.name }}</text>
                        <text class="reward-points">⭐ {{ reward.points }}</text>
                    </view>
                    <text class="reward-desc">{{ reward.description }}</text>
                    <view class="reward-meta">
                        <text class="reward-category">{{ getCategoryLabel(reward.category) }}</text>
                        <text class="reward-stock">{{ getStockLabel(reward) }}</text>
                    </view>
                </view>
                <view class="reward-actions" @tap.stop>
                    <view class="action-toggle" @tap="handleTogglePublish(reward)">
                        <text :class="reward.isPublished ? 'off-shelf' : 'on-shelf'">
                            {{ reward.isPublished ? '下架' : '上架' }}
                        </text>
                    </view>
                    <view class="action-btn" @tap="handleEditReward(reward)">
                        <text>编辑</text>
                    </view>
                    <view class="action-btn delete" @tap="handleDeleteReward(reward)">
                        <text>删除</text>
                    </view>
                </view>
            </view>

            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <view v-else-if="rewards.length === 0" class="empty-state">
                <text class="empty-icon">🎁</text>
                <text class="empty-text">暂无奖励</text>
                <text class="empty-hint">点击右上角添加新奖励</text>
            </view>
        </view>

        <!-- 兑换记录 -->
        <view v-else class="orders-list">
            <view
                v-for="order in orders"
                :key="order.id"
                class="order-card"
                @tap="handleOrderDetail(order)"
            >
                <view class="order-header">
                    <view class="order-user">
                        <text class="user-name">{{ order.userNickname }}</text>
                    </view>
                    <view class="order-status" :class="order.status">
                        <text>{{ getOrderStatusLabel(order.status) }}</text>
                    </view>
                </view>
                <view class="order-body">
                    <image
                        class="order-img"
                        :src="order.rewardImage || '/static/default-avatar.svg'"
                        mode="aspectFill"
                    />
                    <view class="order-info">
                        <text class="order-reward-name">{{ order.rewardName }}</text>
                        <text class="order-remark">{{ order.remark ? '备注：' + order.remark : '无备注' }}</text>
                        <text class="order-time">{{ formatTime(order.createdAt) }}</text>
                    </view>
                    <view class="order-points">-{{ order.rewardPoints }} ⭐</view>
                </view>
                <view class="order-footer">
                    <view class="order-actions" @tap.stop>
                        <view
                            v-if="order.status === 'pending'"
                            class="action-btn received"
                            @tap="handleMarkReceived(order)"
                        >
                            <text>确认已领取</text>
                        </view>
                    </view>
                </view>
            </view>

            <view v-if="orders.length === 0" class="empty-state">
                <text class="empty-icon">📋</text>
                <text class="empty-text">暂无兑换记录</text>
                <text class="empty-hint">用户兑换后将显示在这里</text>
            </view>
        </view>

        <!-- 添加/编辑奖励弹窗 -->
        <view v-if="showRewardModal" class="modal-overlay" @tap="handleCloseRewardModal">
            <view class="modal-content reward-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">{{ editingReward ? '编辑奖励' : '添加奖励' }}</text>
                    <text class="modal-close" @tap="handleCloseRewardModal">×</text>
                </view>
                <scroll-view scroll-y class="modal-body">
                    <view class="form-item">
                        <text class="form-label">奖励名称 *</text>
                        <input
                            v-model="rewardForm.name"
                            class="form-input"
                            placeholder="请输入奖励名称"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">奖励描述</text>
                        <textarea
                            v-model="rewardForm.description"
                            class="form-textarea"
                            placeholder="请输入奖励描述"
                            rows="3"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">奖励类型 *</text>
                        <view class="category-select">
                            <view
                                v-for="cat in categoryOptions"
                                :key="cat.key"
                                class="category-option"
                                :class="{ active: rewardForm.category === cat.key }"
                                @tap="handleCategoryChange(cat.key)"
                            >
                                <text>{{ cat.label }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="form-item">
                        <text class="form-label">所需积分 *</text>
                        <input
                            v-model="rewardForm.points"
                            class="form-input"
                            type="number"
                            placeholder="请输入所需积分"
                        />
                    </view>
                    <view v-if="rewardForm.category === 'dish'" class="form-item">
                        <text class="form-label">关联菜品 *</text>
                        <scroll-view scroll-x class="dish-select-scroll" show-scrollbar="false">
                            <view class="dish-select">
                                <view
                                    v-for="dish in dishes"
                                    :key="dish.id"
                                    class="dish-option"
                                    :class="{ active: rewardForm.dishId === dish.id }"
                                    @tap="rewardForm.dishId = dish.id"
                                >
                                    <text>{{ dish.name }}</text>
                                </view>
                                <view v-if="dishes.length === 0" class="dish-empty-hint">
                                    <text>暂无菜品，请先到菜单管理添加</text>
                                </view>
                            </view>
                        </scroll-view>
                    </view>
                    <view class="form-item">
                        <text class="form-label">库存（-1 为不限量）</text>
                        <input
                            v-model="rewardForm.stock"
                            class="form-input"
                            type="number"
                            placeholder="输入 -1 或库存数量"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">图片 URL</text>
                        <input
                            v-model="rewardForm.imageUrl"
                            class="form-input"
                            placeholder="可选，粘贴图片链接"
                        />
                    </view>
                    <view class="form-item">
                        <view class="publish-toggle" @tap="rewardForm.isPublished = !rewardForm.isPublished">
                            <text>{{ rewardForm.isPublished ? '✓ 创建后立即上架' : '创建后保持下架' }}</text>
                        </view>
                    </view>
                </scroll-view>
                <view class="modal-footer">
                    <view class="modal-btn cancel" @tap="handleCloseRewardModal">
                        <text>取消</text>
                    </view>
                    <view class="modal-btn confirm" @tap="handleSaveReward">
                        <text>{{ editingReward ? '保存' : '添加' }}</text>
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
import * as rewardApi from '@/api/reward'
import * as dishApi from '@/api/dish'
import type { Reward, RewardCategory, RewardOrder, Dish } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 标签页
const tabs = [
    { key: 'rewards', label: '奖励列表' },
    { key: 'orders', label: '兑换记录' },
]
const currentTab = ref('rewards')

const isAdmin = computed(() => userStore.isAdmin())
const familyId = computed(() => userStore.familyId)

// 分类选项
const categoryOptions: Array<{ key: RewardCategory; label: string }> = [
    { key: 'physical', label: '实物商品' },
    { key: 'gift', label: '礼物奖励' },
    { key: 'play', label: '游玩奖励' },
    { key: 'dish', label: '菜品兑换' },
]

// 奖励数据
const rewards = ref<Reward[]>([])
const loading = ref(false)
const orders = ref<RewardOrder[]>([])
const ordersLoading = ref(false)

// 菜品（用于菜品兑换类型联动）
const dishes = ref<Dish[]>([])

// 弹窗状态
const showRewardModal = ref(false)
const editingReward = ref<Reward | null>(null)

const rewardForm = ref({
    name: '',
    description: '',
    category: 'gift' as RewardCategory,
    points: '',
    stock: '-1',
    imageUrl: '',
    dishId: null as number | null,
    isPublished: false,
})

async function loadDishes() {
    if (!familyId.value) return
    try {
        dishes.value = await dishApi.listDishes(familyId.value, { includeUnpublished: true })
    } catch (err) {
        // ignore
    }
}

onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    if (!isAdmin.value) {
        uni.showToast({ title: '仅管理员可访问', icon: 'none' })
        setTimeout(() => {
            uni.reLaunch({ url: '/pages/mall/index' })
        }, 1000)
        return
    }
    await loadRewards()
})

async function loadRewards() {
    if (!familyId.value) return
    loading.value = true
    try {
        rewards.value = await rewardApi.listRewards(familyId.value, { includeUnpublished: true })
    } catch (err) {
        // ignore
    } finally {
        loading.value = false
    }
}

async function loadOrders() {
    if (!familyId.value) return
    ordersLoading.value = true
    try {
        orders.value = await rewardApi.listRewardOrders(familyId.value)
    } catch (err) {
        // ignore
    } finally {
        ordersLoading.value = false
    }
}

const handleTabChange = (key: string) => {
    currentTab.value = key
    if (key === 'orders') loadOrders()
}

const getCategoryLabel = (cat: RewardCategory) => {
    const labels: Record<RewardCategory, string> = {
        physical: '实物商品',
        gift: '礼物奖励',
        play: '游玩奖励',
        dish: '菜品兑换',
    }
    return labels[cat] || cat
}

const getStockLabel = (reward: Reward) => {
    if (reward.stock === -1) return '不限量'
    if (reward.stock === 0) return '已售罄'
    return `剩余 ${reward.stock}`
}

const getOrderStatusLabel = (status: string) => {
    if (status === 'received') return '已领取'
    if (status === 'cancelled') return '已撤销'
    return '待领取'
}

const formatTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso.replace(' ', 'T'))
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    if (sameDay) return `今天 ${hh}:${mm}`
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}

const handleShowAddReward = async () => {
    editingReward.value = null
    rewardForm.value = {
        name: '',
        description: '',
        category: 'gift',
        points: '',
        stock: '-1',
        imageUrl: '',
        dishId: null,
        isPublished: false,
    }
    showRewardModal.value = true
    await loadDishes()
}

const handleEditReward = async (reward: Reward) => {
    editingReward.value = reward
    rewardForm.value = {
        name: reward.name,
        description: reward.description || '',
        category: reward.category,
        points: String(reward.points),
        stock: String(reward.stock),
        imageUrl: reward.imageUrl || '',
        dishId: reward.dishId ?? null,
        isPublished: reward.isPublished,
    }
    if (reward.category === 'dish') await loadDishes()
    showRewardModal.value = true
}

const handleCategoryChange = async (cat: RewardCategory) => {
    rewardForm.value.category = cat
    if (cat === 'dish') {
        await loadDishes()
    } else {
        rewardForm.value.dishId = null
    }
}

const handleCloseRewardModal = () => {
    showRewardModal.value = false
    editingReward.value = null
}

const handleSaveReward = async () => {
    if (!rewardForm.value.name.trim()) {
        uni.showToast({ title: '请输入奖励名称', icon: 'none' })
        return
    }
    const pointsNum = Number(rewardForm.value.points)
    if (!Number.isFinite(pointsNum) || pointsNum <= 0) {
        uni.showToast({ title: '请输入有效的积分', icon: 'none' })
        return
    }
    if (rewardForm.value.category === 'dish' && !rewardForm.value.dishId) {
        uni.showToast({ title: '请选择关联菜品', icon: 'none' })
        return
    }
    if (!familyId.value) return

    const payload = {
        familyId: familyId.value,
        name: rewardForm.value.name.trim(),
        description: rewardForm.value.description,
        category: rewardForm.value.category,
        points: pointsNum,
        imageUrl: rewardForm.value.imageUrl,
        stock: Number(rewardForm.value.stock),
        dishId: rewardForm.value.category === 'dish' ? rewardForm.value.dishId : null,
        isPublished: rewardForm.value.isPublished,
    }

    try {
        if (editingReward.value) {
            await rewardApi.updateReward(editingReward.value.id, payload)
            uni.showToast({ title: '奖励已更新', icon: 'success' })
        } else {
            await rewardApi.createReward(payload)
            uni.showToast({ title: '奖励已添加', icon: 'success' })
        }
        handleCloseRewardModal()
        await loadRewards()
    } catch (err) {
        // ignore
    }
}

const handleTogglePublish = async (reward: Reward) => {
    try {
        await rewardApi.toggleRewardPublish(reward.id, familyId.value, !reward.isPublished)
        uni.showToast({ title: reward.isPublished ? '已下架' : '已上架', icon: 'success' })
        await loadRewards()
    } catch (err) {
        // ignore
    }
}

const handleDeleteReward = (reward: Reward) => {
    uni.showModal({
        title: '确认删除',
        content: `确定要删除 "${reward.name}" 吗？`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await rewardApi.deleteReward(familyId.value, reward.id)
                    uni.showToast({ title: '奖励已删除', icon: 'success' })
                    await loadRewards()
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}

const handleOrderDetail = (order: RewardOrder) => {
    uni.showModal({
        title: '兑换详情',
        content: `兑换人：${order.userNickname}\n奖励：${order.rewardName}\n消耗：${order.rewardPoints} 积分\n状态：${getOrderStatusLabel(order.status)}\n时间：${formatTime(order.createdAt)}${order.remark ? '\n备注：' + order.remark : ''}`,
        showCancel: false,
    })
}

const handleMarkReceived = (order: RewardOrder) => {
    uni.showModal({
        title: '确认已领取',
        content: `确认 "${order.userNickname}" 已领取「${order.rewardName}」吗？`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await rewardApi.markRewardReceived(familyId.value, order.id)
                    uni.showToast({ title: '已确认领取', icon: 'success' })
                    await loadOrders()
                } catch (err) {
                    // ignore
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

.tabs-section {
    padding: 0 24rpx;
    margin-bottom: 20rpx;
}

.tabs {
    display: flex;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 6rpx;
}

.tab-item {
    flex: 1;
    text-align: center;
    padding: 18rpx 0;
    font-size: 28rpx;
    color: #666;
    border-radius: 8rpx;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

// 奖励列表
.reward-list {
    padding: 0 24rpx;
}

.reward-card {
    display: flex;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;

    &.unpublished {
        opacity: 0.6;
    }
}

.reward-image-wrap {
    position: relative;
    margin-right: 16rpx;
}

.reward-img {
    width: 140rpx;
    height: 140rpx;
    border-radius: 12rpx;
    background-color: #f0f0f0;
}

.unpublished-tag {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 4rpx 10rpx;
    border-radius: 6rpx;
    font-size: 20rpx;
}

.reward-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.reward-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
}

.reward-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
}

.reward-points {
    font-size: 28rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

.reward-desc {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.reward-meta {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.reward-category {
    font-size: 22rpx;
    color: #666;
    padding: 4rpx 12rpx;
    background-color: #f5f5f5;
    border-radius: 6rpx;
}

.reward-stock {
    font-size: 22rpx;
    color: #999;
}

.reward-actions {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-left: 12rpx;
}

.action-toggle {
    padding: 10rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    text-align: center;
}

.on-shelf {
    background-color: #e8f5e9;
    color: #4caf50;
}

.off-shelf {
    background-color: #fff3e0;
    color: #f0ad4e;
}

.action-btn {
    padding: 10rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    background-color: #f5f5f5;
    color: #666;
    text-align: center;

    &.delete {
        background-color: #ffebee;
        color: #f44336;
    }

    &.received {
        background-color: #e8f5e9;
        color: #4caf50;
    }
}

// 兑换记录
.orders-list {
    padding: 0 24rpx;
}

.order-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
}

.user-name {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
}

.order-status {
    padding: 6rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;

    &.pending {
        background-color: #fff3e0;
        color: #f0ad4e;
    }

    &.received {
        background-color: #e8f5e9;
        color: #4caf50;
    }
}

.order-body {
    display: flex;
    align-items: center;
    padding: 16rpx 0;
    border-top: 1rpx solid #f5f5f5;
    border-bottom: 1rpx solid #f5f5f5;
}

.order-img {
    width: 100rpx;
    height: 100rpx;
    border-radius: 10rpx;
    background-color: #f0f0f0;
    margin-right: 16rpx;
}

.order-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.order-reward-name {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 4rpx;
}

.order-remark {
    font-size: 22rpx;
    color: #999;
    margin-bottom: 4rpx;
}

.order-time {
    font-size: 22rpx;
    color: #ccc;
}

.order-points {
    font-size: 30rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

.order-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 16rpx;
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

.reward-modal {
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
    display: flex;
    border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
    flex: 1;
    padding: 28rpx 0;
    text-align: center;
    font-size: 30rpx;

    &.cancel {
        color: #666;
        border-right: 1rpx solid #f0f0f0;
    }

    &.confirm {
        color: var(--theme-primary);
        font-weight: bold;
    }
}

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

.form-textarea {
    width: 100%;
    padding: 20rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

.category-select {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.category-option {
    padding: 12rpx 20rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.publish-toggle {
    padding: 16rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #666;
    text-align: center;
}

// 菜品选择
.dish-select-scroll {
    white-space: nowrap;
}

.dish-select {
    display: flex;
    gap: 12rpx;
}

.dish-option {
    display: inline-block;
    padding: 12rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #666;
    flex-shrink: 0;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
        border: 1rpx solid var(--theme-primary);
    }
}

.dish-empty-hint {
    display: inline-block;
    padding: 12rpx 24rpx;
    font-size: 26rpx;
    color: #999;
    flex-shrink: 0;
}
</style>
