<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-card">
                <view class="header-left">
                    <text class="header-title">积分商城</text>
                    <text class="header-sub">我的可兑换奖励</text>
                </view>
                <view class="header-right">
                    <view class="points-entry" @tap="handleGoPoints">
                        <text class="points-label">我的积分</text>
                        <text class="points-value">{{ myPoints }}</text>
                        <text class="points-arrow">›</text>
                    </view>
                    <view v-if="isAdmin" class="records-btn" @tap="handleGoManage">
                        <text>管理</text>
                    </view>
                    <view class="records-btn" @tap="handleGoRecords">
                        <text>兑换记录</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 分类筛选 -->
        <view class="tabs-section">
            <scroll-view scroll-x class="tabs-scroll" show-scrollbar="false">
                <view class="tabs">
                    <view
                        v-for="cat in categoryTabs"
                        :key="cat.key"
                        class="tab-item"
                        :class="{ active: currentCategory === cat.key }"
                        @tap="handleCategoryChange(cat.key)"
                    >
                        <text>{{ cat.label }}</text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 奖励列表 -->
        <view class="reward-list">
            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <template v-else>
                <view
                    v-for="reward in filteredRewards"
                    :key="reward.id"
                    class="reward-card"
                    @tap="handleRewardDetail(reward)"
                >
                    <view class="reward-image-wrap">
                        <image
                            class="reward-img"
                            :src="reward.imageUrl || '/static/default-avatar.svg'"
                            mode="aspectFill"
                        />
                        <view class="reward-type" :class="reward.category">
                            <text>{{ getCategoryLabel(reward.category) }}</text>
                        </view>
                    </view>
                    <view class="reward-info">
                        <text class="reward-name">{{ reward.name }}</text>
                        <text class="reward-desc">{{ reward.description || '暂无描述' }}</text>
                        <view class="reward-bottom">
                            <text class="reward-points">⭐ {{ reward.points }} 积分</text>
                            <text class="reward-stock">{{ getStockLabel(reward) }}</text>
                        </view>
                    </view>
                    <view class="reward-action" @tap.stop="handleRedeem(reward)">
                        <text class="redeem-text">兑换</text>
                    </view>
                </view>

                <view v-if="filteredRewards.length === 0" class="empty-state">
                    <text class="empty-icon">🎁</text>
                    <text class="empty-text">暂无该分类的奖励</text>
                </view>
            </template>
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
import type { Reward, RewardCategory } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 分类 tab：全部 + 四类
const categoryTabs: Array<{ key: RewardCategory | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'physical', label: '实物商品' },
    { key: 'gift', label: '礼物奖励' },
    { key: 'play', label: '游玩奖励' },
    { key: 'dish', label: '菜品兑换' },
]
const currentCategory = ref<RewardCategory | 'all'>('all')

const rewards = ref<Reward[]>([])
const loading = ref(false)

const familyId = computed(() => userStore.familyId)
const myPoints = computed(() => userStore.getCurrentPoints)
const isAdmin = computed(() => userStore.isAdmin())

const filteredRewards = computed(() => {
    if (currentCategory.value === 'all') return rewards.value
    return rewards.value.filter(r => r.category === currentCategory.value)
})

onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    await loadRewards()
    if (myPoints.value !== userStore.getCurrentPoints) {
        // 确保刷新积分显示
        userStore.fetchProfile()
    }
})

async function loadRewards() {
    if (!familyId.value) return
    loading.value = true
    try {
        rewards.value = await rewardApi.listRewards(familyId.value)
    } catch (err) {
        // 错误已由 http 拦截器 toast
    } finally {
        loading.value = false
    }
}

const getCategoryLabel = (cat: RewardCategory) => {
    const labels: Record<RewardCategory, string> = {
        physical: '实物',
        gift: '礼物',
        play: '游玩',
        dish: '菜品',
    }
    return labels[cat] || cat
}

const getStockLabel = (reward: Reward) => {
    if (reward.stock === -1) return '不限量'
    if (reward.stock === 0) return '已售罄'
    return `剩余 ${reward.stock}`
}

const handleCategoryChange = (key: RewardCategory | 'all') => {
    currentCategory.value = key
}

const handleRewardDetail = (reward: Reward) => {
    uni.showModal({
        title: reward.name,
        content: `类型：${getCategoryLabel(reward.category)}\n积分：${reward.points}\n${getStockLabel(reward)}\n\n${reward.description || '暂无描述'}`,
        showCancel: false,
        confirmText: '知道了',
    })
}

const handleRedeem = (reward: Reward) => {
    if (reward.stock === 0) {
        uni.showToast({ title: '该奖励已售罄', icon: 'none' })
        return
    }
    if (myPoints.value < reward.points) {
        uni.showToast({ title: '积分不足', icon: 'none' })
        return
    }
    uni.showModal({
        title: '确认兑换',
        content: `确定使用 ${reward.points} 积分兑换「${reward.name}」吗？兑换后积分将扣除。`,
        editable: true,
        placeholderText: '兑换备注（可选）',
        success: async (res) => {
            if (!res.confirm) return
            if (!familyId.value) return
            try {
                await rewardApi.redeemReward({
                    familyId: familyId.value,
                    rewardId: reward.id,
                    remark: (res.content as string) || '',
                })
                uni.showToast({ title: '兑换成功', icon: 'success' })
                // 刷新商城列表与全局积分
                await loadRewards()
                await userStore.fetchProfile()
            } catch (err) {
                // 错误已由 http 拦截器 toast
            }
        },
    })
}

const handleGoRecords = () => {
    uni.navigateTo({ url: '/pages/mall/records' })
}

const handleGoManage = () => {
    uni.navigateTo({ url: '/pages/mall/manage' })
}

// 跳转积分管理
const handleGoPoints = () => {
    uni.navigateTo({ url: '/pages/points/index' })
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
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    flex-direction: column;
}

.header-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.header-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.85);
}

.header-right {
    display: flex;
    align-items: center;
}

.points-entry {
    display: flex;
    align-items: baseline;
    margin-right: 20rpx;
    padding-right: 20rpx;
}

.points-label {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.85);
    margin-right: 8rpx;
}

.points-value {
    font-size: 44rpx;
    font-weight: bold;
    color: #fff;
}

.points-arrow {
    font-size: 40rpx;
    color: rgba(255, 255, 255, 0.85);
    margin-left: 8rpx;
    line-height: 1;
}

.records-btn {
    padding: 10rpx 20rpx;
    background-color: rgba(255, 255, 255, 0.25);
    border-radius: 24rpx;
    font-size: 24rpx;
    color: #fff;
}

// 分类
.tabs-section {
    padding: 0 24rpx;
    margin-bottom: 20rpx;
}

.tabs-scroll {
    white-space: nowrap;
}

.tabs {
    display: inline-flex;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 6rpx;
    gap: 4rpx;
}

.tab-item {
    padding: 16rpx 28rpx;
    font-size: 26rpx;
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
    align-items: center;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
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

.reward-type {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    padding: 4rpx 10rpx;
    border-radius: 6rpx;
    font-size: 20rpx;
    color: #fff;

    &.physical {
        background-color: #1976d2;
    }
    &.gift {
        background-color: #e91e63;
    }
    &.play {
        background-color: #7b1fa2;
    }
    &.dish {
        background-color: #f57c00;
    }
}

.reward-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.reward-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 6rpx;
}

.reward-desc {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.reward-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.reward-points {
    font-size: 28rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

.reward-stock {
    font-size: 22rpx;
    color: #999;
}

.reward-action {
    margin-left: 16rpx;
}

.redeem-text {
    display: inline-block;
    padding: 14rpx 24rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 24rpx;
    font-size: 26rpx;
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
</style>
