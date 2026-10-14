<template>
    <view class="page" :style="pageStyle">
        <!-- 标题栏 -->
        <view class="navbar">
            <view class="back-btn" @tap="handleBack">
                <text>‹</text>
            </view>
            <text class="navbar-title">我的兑换记录</text>
            <view class="navbar-right"></view>
        </view>

        <!-- 记录列表 -->
        <view class="record-list">
            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <template v-else>
                <view
                    v-for="order in orders"
                    :key="order.id"
                    class="record-card"
                >
                    <image
                        class="record-img"
                        :src="order.rewardImage || '/static/default-avatar.svg'"
                        mode="aspectFill"
                    />
                    <view class="record-info">
                        <text class="record-name">{{ order.rewardName }}</text>
                        <text class="record-time">{{ formatTime(order.createdAt) }}</text>
                    </view>
                    <view class="record-right">
                        <text class="record-points">-{{ order.rewardPoints }} ⭐</text>
                        <text class="record-status" :class="order.status">
                            {{ getStatusLabel(order.status) }}
                        </text>
                        <view
                            v-if="order.status === 'pending'"
                            class="cancel-btn"
                            @tap.stop="handleCancel(order)"
                        >
                            <text>撤销</text>
                        </view>
                    </view>
                </view>

                <view v-if="orders.length === 0" class="empty-state">
                    <text class="empty-icon">📋</text>
                    <text class="empty-text">暂无兑换记录</text>
                    <text class="empty-hint">去商城兑换心仪的奖励吧</text>
                </view>
            </template>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import * as rewardApi from '@/api/reward'
import type { RewardOrder } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

const orders = ref<RewardOrder[]>([])
const loading = ref(false)

onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    await loadRecords()
})

async function loadRecords() {
    if (!userStore.familyId) return
    loading.value = true
    try {
        orders.value = await rewardApi.listRewardOrders(userStore.familyId, {
            mine: true,
        })
    } catch (err) {
        // ignore
    } finally {
        loading.value = false
    }
}

const getStatusLabel = (status: string) => {
    if (status === 'received') return '已领取'
    if (status === 'cancelled') return '已撤销'
    return '待领取'
}

const handleCancel = (order: RewardOrder) => {
    uni.showModal({
        title: '撤销兑换',
        content: `确定撤销兑换「${order.rewardName}」吗？撤销后 ${order.rewardPoints} 积分将退回。`,
        success: async (res) => {
            if (!res.confirm) return
            try {
                await rewardApi.cancelRewardOrder(userStore.familyId, order.id)
                uni.showToast({ title: '已撤销，积分已退回', icon: 'success' })
                await loadRecords()
                await userStore.fetchProfile()
            } catch (err) {
                // ignore
            }
        },
    })
}

const formatTime = (iso: string) => {
    if (!iso) return ''
    return iso.replace('T', ' ').replace(/\..*$/, '').slice(0, 16)
}

const handleBack = () => {
    uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
    min-height: 100vh;
    background-color: #f5f5f5;
}

.navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    background-color: #fff;
}

.back-btn {
    width: 60rpx;
    font-size: 56rpx;
    color: #333;
    line-height: 1;
}

.navbar-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #333;
}

.navbar-right {
    width: 60rpx;
}

.record-list {
    padding: 24rpx;
}

.record-card {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
}

.record-img {
    width: 100rpx;
    height: 100rpx;
    border-radius: 10rpx;
    background-color: #f0f0f0;
    margin-right: 20rpx;
    flex-shrink: 0;
}

.record-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.record-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.record-time {
    font-size: 22rpx;
    color: #999;
}

.record-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 12rpx;
}

.record-points {
    font-size: 28rpx;
    font-weight: bold;
    color: var(--theme-primary);
    margin-bottom: 8rpx;
}

.record-status {
    padding: 4rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    margin-bottom: 8rpx;

    &.pending {
        background-color: #fff3e0;
        color: #f0ad4e;
    }

    &.received {
        background-color: #e8f5e9;
        color: #4caf50;
    }

    &.cancelled {
        background-color: #f5f5f5;
        color: #999;
    }
}

.cancel-btn {
    padding: 6rpx 18rpx;
    background-color: #ffebee;
    color: #f44336;
    border-radius: 16rpx;
    font-size: 22rpx;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
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
</style>
