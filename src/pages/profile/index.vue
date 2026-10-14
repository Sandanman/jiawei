<template>
    <view class="container" :style="pageStyle">
        <!-- 用户信息卡片 -->
        <view class="user-card">
            <view class="user-info">
                <image class="avatar" :src="avatarSrc" mode="aspectFill" />
                <view class="info-text">
                    <text class="nickname">{{ userStore.nickname || '未登录' }}</text>
                    <view class="role-badge" :class="userStore.isAdmin() ? 'admin' : 'member'">
                        <text>{{ userStore.isAdmin() ? '管理员' : '家庭成员' }}</text>
                    </view>
                </view>
            </view>
            <view class="logout-btn" @tap="handleLogout">
                <text>退出登录</text>
            </view>
        </view>

        <!-- 当前家庭信息 -->
        <view class="current-family-card">
            <view class="card-header">
                <text class="card-title">当前家庭</text>
                <view v-if="currentFamily?.isAdmin" class="edit-name-btn" @tap="handleEditFamilyName">
                    <text>✏️ 修改名称</text>
                </view>
            </view>
            <view class="current-family-info">
                <text class="family-name">{{ currentFamily?.familyName || '暂无家庭' }}</text>
                <view class="points-box">
                    <text class="points-label">我的积分</text>
                    <text class="points-value">{{ currentPoints }}</text>
                </view>
            </view>
        </view>

        <!-- 家庭切换 -->
        <view class="family-section">
            <view class="section-header">
                <text class="section-title">家庭切换</text>
                <view class="add-family-btn" @tap="handleAddFamily">
                    <text>+ 添加家庭</text>
                </view>
            </view>
            <view class="family-list">
                <view
                    v-for="family in userStore.families"
                    :key="family.familyId"
                    class="family-item"
                    :class="{ active: family.familyId === userStore.familyId }"
                    @tap="handleSwitchFamily(family.familyId)"
                >
                    <view class="family-item-left">
                        <text class="family-item-name">{{ family.familyName }}</text>
                        <view class="family-item-badges">
                            <view v-if="family.isAdmin" class="badge admin-badge">
                                <text>管理员</text>
                            </view>
                            <view class="badge points-badge">
                                <text>{{ family.points }} 积分</text>
                            </view>
                        </view>
                    </view>
                    <view class="family-item-right">
                        <text v-if="family.familyId === userStore.familyId" class="check-icon">✓</text>
                        <text v-else class="arrow-icon">›</text>
                    </view>
                </view>
            </view>
            <view v-if="userStore.families.length === 0" class="empty-tip">
                <text>暂未加入任何家庭</text>
            </view>
        </view>

        <!-- 主题设置 -->
        <view class="theme-section">
            <view class="section-header">
                <text class="section-title">主题颜色</text>
            </view>
            <view class="theme-options">
                <view
                    v-for="item in themePresets"
                    :key="item.color"
                    class="theme-option"
                    :class="{ active: item.color === themeStore.color }"
                    @tap="handleSelectTheme(item.color)"
                >
                    <view class="theme-circle" :style="{ background: item.color }">
                        <text v-if="item.color === themeStore.color" class="theme-check">✓</text>
                    </view>
                    <text class="theme-name">{{ item.name }}</text>
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
import { useThemeStore, THEME_PRESETS } from '@/stores/theme'
import CustomTabBar from '@/components/custom-tab-bar/index.vue'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 主题切换
const themePresets = THEME_PRESETS

// Pinia setup store 的 computed 属性会被自动展开，直接访问无需括号
const currentFamily = computed(() => userStore.getCurrentFamily)
const currentPoints = computed(() => userStore.getCurrentPoints)

// 头像：管理员与成员使用不同图片
const avatarSrc = computed(() =>
    userStore.isAdmin() ? '/static/images/manager.png' : '/static/images/user.png'
)

// 检查登录状态
onShow(() => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
    }
})

// 退出登录
const handleLogout = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
            if (res.confirm) {
                userStore.logout()
                uni.redirectTo({ url: '/pages/login/index' })
            }
        },
    })
}

// 切换家庭
const handleSwitchFamily = (familyId: string) => {
    userStore.switchFamily(familyId)
}

// 添加家庭
const handleAddFamily = () => {
    uni.showToast({ title: '功能开发中', icon: 'none' })
}

// 修改家庭名称（管理员）
const handleEditFamilyName = () => {
    if (!currentFamily.value?.isAdmin) return
    uni.showModal({
        title: '修改家庭名称',
        editable: true,
        placeholderText: '请输入新的家庭名称',
        content: currentFamily.value?.familyName || '',
        success: (res) => {
            if (res.confirm && res.content) {
                const newName = res.content.trim()
                if (newName && newName !== currentFamily.value?.familyName) {
                    userStore.updateFamilyName(userStore.familyId, newName)
                    uni.showToast({ title: '修改成功', icon: 'success' })
                }
            }
        },
    })
}

// 切换主题色
const handleSelectTheme = (color: string) => {
    themeStore.setColor(color)
    uni.showToast({ title: '已切换主题', icon: 'success' })
}
</script>

<style scoped lang="scss">
.container {
    min-height: calc(100vh - var(--status-bar-height) - 44px);
    background-color: #f5f5f5;
    padding: 20rpx;
    padding-bottom: 160rpx;
    box-sizing: border-box;
}

// 用户信息卡片
.user-card {
    background: linear-gradient(135deg, var(--theme-primary-grad-start) 0%, var(--theme-primary-grad-end) 100%);
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.user-info {
    display: flex;
    align-items: center;
}

.avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50rpx;
    margin-right: 24rpx;
    background-color: #f0f0f0;
}

.info-text {
    display: flex;
    flex-direction: column;
}

.nickname {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.role-badge {
    display: inline-flex;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;

    &.admin {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
    }

    &.member {
        background-color: #e8f5e9;
        color: #4caf50;
    }
}

.logout-btn {
    padding: 12rpx 24rpx;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 24rpx;
    font-size: 24rpx;
    color: #fff;
    background-color: rgba(255, 255, 255, 0.2);
}

// 当前家庭信息
.current-family-card {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 20rpx;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.edit-name-btn {
    display: flex;
    align-items: center;
    padding: 6rpx 16rpx;
    background-color: var(--theme-primary-bg);
    border-radius: 16rpx;
    font-size: 24rpx;
    color: var(--theme-primary);
}

.card-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
}

.current-family-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.family-name {
    font-size: 32rpx;
    color: #333;
}

.points-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.points-label {
    font-size: 22rpx;
    color: #999;
    margin-bottom: 4rpx;
}

.points-value {
    font-size: 40rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

// 家庭切换
.family-section {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 20rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
}

.add-family-btn {
    padding: 8rpx 20rpx;
    background-color: var(--theme-primary-bg);
    border-radius: 20rpx;
    font-size: 24rpx;
    color: var(--theme-primary);
}

.family-list {
    // empty
}

.family-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
        border-bottom: none;
    }

    &.active {
        background-color: var(--theme-primary-bg);
        margin: 0 -32rpx;
        padding: 24rpx 32rpx;
        border-radius: 12rpx;
    }
}

.family-item-left {
    display: flex;
    flex-direction: column;
}

.family-item-name {
    font-size: 30rpx;
    color: #333;
    margin-bottom: 8rpx;
}

.family-item-badges {
    display: flex;
    gap: 12rpx;
}

.badge {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 20rpx;
}

.admin-badge {
    background-color: var(--theme-primary-bg);
    color: var(--theme-primary);
}

.points-badge {
    background-color: #f5f5f5;
    color: #666;
}

.family-item-right {
    // empty
}

.check-icon {
    font-size: 36rpx;
    color: var(--theme-primary);
    font-weight: bold;
}

.arrow-icon {
    font-size: 40rpx;
    color: #ccc;
}

.empty-tip {
    text-align: center;
    padding: 40rpx 0;
    color: #999;
    font-size: 28rpx;
}

// 管理员功能区
.admin-section {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-top: 20rpx;
}

.admin-actions {
    // empty
}

.action-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background-color: #f9f9f9;
    border-radius: 12rpx;

    &:active {
        background-color: #f0f0f0;
    }
}

// 用户功能区
.user-section {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-top: 20rpx;
}

.user-actions {
    // empty
}

.action-badge {
    display: flex;
    align-items: baseline;
    margin-right: 8rpx;
}

.badge-value {
    font-size: 32rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

.badge-unit {
    font-size: 22rpx;
    color: #999;
    margin-left: 4rpx;
}

.action-icon {
    font-size: 48rpx;
    margin-right: 20rpx;
}

.action-text {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.action-title {
    font-size: 30rpx;
    color: #333;
    margin-bottom: 4rpx;
}

.action-desc {
    font-size: 24rpx;
    color: #999;
}

// 主题设置
.theme-section {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-top: 20rpx;
}

.theme-options {
    display: flex;
    flex-wrap: wrap;
}

.theme-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 16rpx 24rpx 8rpx 0;

    &.active .theme-circle {
        border-color: var(--theme-primary);
    }
}

.theme-circle {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    border: 4rpx solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
}

.theme-check {
    color: #fff;
    font-size: 36rpx;
    font-weight: bold;
}

.theme-name {
    margin-top: 8rpx;
    font-size: 20rpx;
    color: #999;
}
</style>