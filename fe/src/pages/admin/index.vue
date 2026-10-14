<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-left">
                <text class="page-title">管理中心</text>
                <text class="page-subtitle">家庭管理与运营工具</text>
            </view>
            <view class="header-avatar" @tap="go('/pages/profile/index')">
                <image class="avatar" :src="avatar" mode="aspectFill" />
            </view>
        </view>

        <!-- 功能入口 -->
        <view class="section">
            <view class="section-title">家庭管理</view>
            <view class="func-grid">
                <view
                    v-for="item in familyItems"
                    :key="item.path"
                    class="func-card"
                    @tap="go(item.path)"
                >
                    <view class="func-icon" :style="{ backgroundImage: `url(${item.icon})` }"></view>
                    <text class="func-name">{{ item.name }}</text>
                    <text class="func-desc">{{ item.desc }}</text>
                </view>
            </view>
        </view>

        <view class="section">
            <view class="section-title">运营管理</view>
            <view class="func-grid">
                <view
                    v-for="item in opsItems"
                    :key="item.path"
                    class="func-card"
                    @tap="go(item.path)"
                >
                    <view class="func-icon" :style="{ backgroundImage: `url(${item.icon})` }"></view>
                    <text class="func-name">{{ item.name }}</text>
                    <text class="func-desc">{{ item.desc }}</text>
                </view>
            </view>
        </view>

        <CustomTabBar />
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import CustomTabBar from '@/components/custom-tab-bar/index.vue'

interface FuncItem {
    name: string
    desc: string
    path: string
    icon: string
}

const userStore = useUserStore()
const themeStore = useThemeStore()
const pageStyle = computed(() => themeStore.cssVars)

const avatar = computed(() => userStore.avatar || '/static/default-avatar.svg')

// 生成主题色系 icon
function makeIcon(paths: string, color: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const primary = computed(() => themeStore.color)

const memberPaths =
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
const taskPaths =
    '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>'
const pointPaths =
    '<circle cx="12" cy="9" r="5"/><path d="M12 14v5"/><path d="M9 19h6"/><path d="M12 19v2"/>'
const rewardPaths =
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'

const familyItems = computed<FuncItem[]>(() => [
    { name: '成员管理', desc: '邀请与角色设置', path: '/pages/members/index', icon: makeIcon(memberPaths, primary.value) },
    { name: '任务管理', desc: '发布家庭任务', path: '/pages/tasks/index', icon: makeIcon(taskPaths, primary.value) },
    { name: '积分管理', desc: '积分明细与发放', path: '/pages/points/index', icon: makeIcon(pointPaths, primary.value) },
])

const opsItems = computed<FuncItem[]>(() => [
    { name: '奖励管理', desc: '商城与兑换', path: '/pages/mall/manage', icon: makeIcon(rewardPaths, primary.value) },
])

const go = (path: string) => {
    uni.navigateTo({ url: path })
}

onShow(() => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    if (!userStore.isAdmin()) {
        uni.showToast({ title: '仅管理员可访问', icon: 'none' })
        setTimeout(() => {
            uni.reLaunch({ url: '/pages/profile/index' })
        }, 1000)
    }
})
</script>

<style scoped lang="scss">
.container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 140rpx;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 24rpx 12rpx;
}

.page-title {
    font-size: 44rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
    display: block;
}

.page-subtitle {
    font-size: 24rpx;
    color: #999;
}

.header-avatar {
    width: 80rpx;
    height: 80rpx;
}

.avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #e0e0e0;
}

.section {
    margin-top: 20rpx;
    padding: 0 24rpx;
}

.section-title {
    font-size: 26rpx;
    color: #999;
    margin-bottom: 16rpx;
}

.func-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.func-card {
    flex: 1;
    min-width: 200rpx;
    background-color: #fff;
    border-radius: 20rpx;
    padding: 32rpx 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
}

.func-icon {
    width: 52rpx;
    height: 52rpx;
    margin-bottom: 8rpx;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
}

.func-name {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
}

.func-desc {
    font-size: 22rpx;
    color: #999;
    text-align: center;
}
</style>
