<script setup lang="ts">
/**
 * Mock 登录页 - H5 端（已废弃，保留兼容）
 * 真实登录请使用 /pages/login/index
 */
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

const username = ref('')
const password = ref('')
const isLoading = ref(false)

// 处理登录
const handleLogin = async () => {
    if (!username.value || !password.value) {
        uni.showToast({ title: '请输入账号和密码', icon: 'none' })
        return
    }

    isLoading.value = true

    try {
        const success = await userStore.login(username.value, password.value)

        if (success) {
            // 统一跳转到家庭选择页，由用户选择进入哪个家庭
            uni.reLaunch({ url: '/pages/family/select' })
        } else {
            uni.showToast({ title: '账号或密码错误', icon: 'none' })
        }
    } catch (err) {
        // request 层已统一 toast，这里仅兜底
        console.error('[login]', err)
    } finally {
        isLoading.value = false
    }
}

// 快速填充测试账号
const fillTestAccount = (type: 'admin' | 'user') => {
    if (type === 'admin') {
        username.value = 'admin'
        password.value = 'admin'
    } else {
        username.value = 'user'
        password.value = 'user'
    }
}
</script>

<template>
    <view class="login-container" :style="pageStyle">
        <!-- 顶部区域 -->
        <view class="header-section">
            <text class="app-name">家味小札</text>
            <text class="app-subtitle">H5 模拟登录</text>
        </view>

        <!-- 登录表单 -->
        <view class="form-section">
            <view class="form-item">
                <text class="label">账号</text>
                <input
                    v-model="username"
                    class="input"
                    type="text"
                    placeholder="请输入账号"
                    maxlength="20"
                />
            </view>

            <view class="form-item">
                <text class="label">密码</text>
                <input
                    v-model="password"
                    class="input"
                    type="password"
                    placeholder="请输入密码"
                    maxlength="20"
                />
            </view>

            <button
                class="login-btn"
                :loading="isLoading"
                @click="handleLogin"
            >
                登录
            </button>
        </view>

        <!-- 快速填充 -->
        <view class="quick-fill">
            <text class="quick-title">快速填充测试账号</text>
            <view class="quick-btns">
                <view class="quick-btn" @click="fillTestAccount('admin')">
                    <text class="quick-icon">👨‍💼</text>
                    <text class="quick-text">管理员</text>
                    <text class="quick-account">admin / admin</text>
                </view>
                <view class="quick-btn" @click="fillTestAccount('user')">
                    <text class="quick-icon">👤</text>
                    <text class="quick-text">普通用户</text>
                    <text class="quick-account">user / user</text>
                </view>
            </view>
        </view>

        <!-- 说明 -->
        <view class="tips">
            <text class="tips-title">说明</text>
            <text class="tips-text">
                · admin/admin 登录后进入管理员首页
            </text>
            <text class="tips-text">
                · user/user 登录后进入成员首页
            </text>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.login-container {
    min-height: 100vh;
    background-color: #f8f8f8;
    padding: 120rpx 48rpx 60rpx;
    box-sizing: border-box;
}

.header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;
}

.app-name {
    font-size: 56rpx;
    font-weight: bold;
    color: var(--theme-primary);
    margin-bottom: 12rpx;
}

.app-subtitle {
    font-size: 28rpx;
    color: #999;
}

.form-section {
    background-color: #fff;
    border-radius: 24rpx;
    padding: 48rpx 32rpx;
    margin-bottom: 48rpx;
}

.form-item {
    margin-bottom: 32rpx;

    &:last-of-type {
        margin-bottom: 48rpx;
    }
}

.label {
    display: block;
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 12rpx;
}

.input {
    width: 100%;
    height: 88rpx;
    border: 2rpx solid #e5e5e5;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 30rpx;
    box-sizing: border-box;

    &:focus {
        border-color: var(--theme-primary);
    }
}

.login-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, var(--theme-primary-grad-start) 0%, var(--theme-primary-grad-end) 100%);
    border-radius: 48rpx;
    color: #fff;
    font-size: 32rpx;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
}

.quick-fill {
    margin-bottom: 48rpx;
}

.quick-title {
    display: block;
    font-size: 28rpx;
    color: #999;
    margin-bottom: 24rpx;
    text-align: center;
}

.quick-btns {
    display: flex;
    gap: 24rpx;
}

.quick-btn {
    flex: 1;
    background-color: #fff;
    border-radius: 20rpx;
    padding: 32rpx 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 2rpx solid #e5e5e5;
}

.quick-icon {
    font-size: 48rpx;
    margin-bottom: 12rpx;
}

.quick-text {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 8rpx;
}

.quick-account {
    font-size: 24rpx;
    color: #999;
}

.tips {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 32rpx;
}

.tips-title {
    display: block;
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 16rpx;
}

.tips-text {
    display: block;
    font-size: 26rpx;
    color: #666;
    line-height: 1.8;
}
</style>
