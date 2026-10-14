<script setup lang="ts">
/**
 * 忘记密码 - 通过手机号 + 新密码直接重置
 */
import { ref, computed } from 'vue'
import { resetPassword as apiResetPassword } from '@/api/auth'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

const username = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

async function handleReset() {
    if (!username.value) {
        uni.showToast({ title: '请输入手机号（账号）', icon: 'none' })
        return
    }
    if (newPassword.value.length < 6 || newPassword.value.length > 32) {
        uni.showToast({ title: '密码长度需为 6-32 位', icon: 'none' })
        return
    }
    if (newPassword.value !== confirmPassword.value) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
    }
    if (isLoading.value) return
    isLoading.value = true
    try {
        await apiResetPassword(username.value, newPassword.value)
        uni.showToast({ title: '密码已重置，请登录', icon: 'success' })
        setTimeout(() => {
            uni.navigateBack()
        }, 1000)
    } catch (err) {
        console.error('[reset-password]', err)
    } finally {
        isLoading.value = false
    }
}

function goLogin() {
    uni.navigateBack()
}
</script>

<template>
    <view class="forgot-container" :style="pageStyle">
        <view class="logo-section">
            <image class="logo" src="/static/logo.svg" mode="aspectFit" />
            <text class="app-name">重置密码</text>
            <text class="app-desc">通过手机号直接设置新密码</text>
        </view>

        <view class="form-section">
            <view class="form-header">
                <text class="back-btn" @click="goLogin">‹</text>
                <text class="form-title">重置密码</text>
            </view>

            <view class="form-item">
                <text class="label">手机号 / 账号</text>
                <input
                    v-model="username"
                    class="input"
                    type="text"
                    placeholder="请输入注册时的手机号或账号"
                    maxlength="32"
                />
            </view>

            <view class="form-item">
                <text class="label">新密码</text>
                <input
                    v-model="newPassword"
                    class="input"
                    type="password"
                    placeholder="6-32 位新密码"
                    maxlength="32"
                />
            </view>

            <view class="form-item">
                <text class="label">确认新密码</text>
                <input
                    v-model="confirmPassword"
                    class="input"
                    type="password"
                    placeholder="请再次输入新密码"
                    maxlength="32"
                />
            </view>

            <button
                class="reset-btn"
                :loading="isLoading"
                @click="handleReset"
            >
                重置密码
            </button>

            <view class="bottom-links">
                <text class="link" @click="goLogin">返回登录</text>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.forgot-container {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--theme-primary-grad-start) 0%, var(--theme-primary-grad-end) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 60rpx 60rpx;
    box-sizing: border-box;
}

.logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;
}

.logo {
    width: 140rpx;
    height: 140rpx;
    border-radius: 28rpx;
    background-color: rgba(255, 255, 255, 0.3);
    margin-bottom: 20rpx;
}

.app-name {
    font-size: 44rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 10rpx;
}

.app-desc {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.85);
}

.form-section {
    width: 100%;
    background-color: #fff;
    border-radius: 24rpx;
    padding: 32rpx 32rpx 48rpx;
    box-sizing: border-box;
}

.form-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
    position: relative;
}

.back-btn {
    font-size: 56rpx;
    color: var(--theme-primary);
    line-height: 1;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.form-title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-right: 60rpx;
}

.form-item {
    margin-bottom: 24rpx;

    &:last-of-type {
        margin-bottom: 40rpx;
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

.reset-btn {
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

.bottom-links {
    display: flex;
    justify-content: center;
    margin-top: 24rpx;
}

.link {
    font-size: 26rpx;
    color: var(--theme-primary);
}
</style>
