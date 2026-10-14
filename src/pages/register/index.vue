<script setup lang="ts">
/**
 * 注册页
 * - 支持手机号密码注册（默认）
 * - 支持自定义账号密码注册
 * 注册成功后自动回登录页
 */
import { ref, computed } from 'vue'
import { register as apiRegister } from '@/api/auth'
import { useThemeStore } from '@/stores/theme'
import type { RegisterType } from '@/api/types'

const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

const type = ref<RegisterType>('phone')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const isLoading = ref(false)

const usernamePlaceholder = computed(() =>
    type.value === 'phone' ? '请输入手机号' : '3-32 位字母/数字/下划线'
)

const titleText = computed(() =>
    type.value === 'phone' ? '手机号注册' : '账号注册'
)

/** 切换注册方式 */
function switchType(t: RegisterType) {
    type.value = t
    username.value = ''
    password.value = ''
    confirmPassword.value = ''
}

/** 校验并注册 */
async function handleRegister() {
    if (!username.value || !password.value) {
        uni.showToast({ title: '请输入账号和密码', icon: 'none' })
        return
    }
    if (type.value === 'phone' && !/^1[3-9]\d{9}$/.test(username.value)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' })
        return
    }
    if (type.value === 'username' && !/^[a-zA-Z0-9_]{3,32}$/.test(username.value)) {
        uni.showToast({ title: '账号需为 3-32 位字母/数字/下划线', icon: 'none' })
        return
    }
    if (password.value.length < 6 || password.value.length > 32) {
        uni.showToast({ title: '密码长度需为 6-32 位', icon: 'none' })
        return
    }
    if (password.value !== confirmPassword.value) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
    }
    if (isLoading.value) return
    isLoading.value = true
    try {
        await apiRegister({
            type: type.value,
            username: username.value,
            password: password.value,
            nickname: nickname.value || undefined
        })
        uni.showToast({ title: '注册成功，请登录', icon: 'success' })
        setTimeout(() => {
            uni.navigateBack()
        }, 1000)
    } catch (err) {
        console.error('[register]', err)
    } finally {
        isLoading.value = false
    }
}

/** 跳转忘记密码 */
function goForgotPassword() {
    uni.navigateTo({ url: '/pages/forgot-password/index' })
}

/** 返回登录 */
function goLogin() {
    uni.navigateBack()
}
</script>

<template>
    <view class="register-container" :style="pageStyle">
        <view class="logo-section">
            <image class="logo" src="/static/logo.svg" mode="aspectFit" />
            <text class="app-name">家味小札</text>
            <text class="app-desc">创建账号，记录家的味道</text>
        </view>

        <view class="form-section">
            <view class="form-header">
                <text class="back-btn" @click="goLogin">‹</text>
                <text class="form-title">{{ titleText }}</text>
            </view>

            <!-- 切换注册方式 -->
            <view class="tab-bar">
                <view
                    class="tab-item"
                    :class="{ active: type === 'phone' }"
                    @click="switchType('phone')"
                >
                    手机号注册
                </view>
                <view
                    class="tab-item"
                    :class="{ active: type === 'username' }"
                    @click="switchType('username')"
                >
                    账号注册
                </view>
            </view>

            <view class="form-item">
                <text class="label">{{ type === 'phone' ? '手机号' : '账号' }}</text>
                <input
                    v-model="username"
                    class="input"
                    type="text"
                    :placeholder="usernamePlaceholder"
                    maxlength="32"
                />
            </view>

            <view class="form-item">
                <text class="label">昵称（选填）</text>
                <input
                    v-model="nickname"
                    class="input"
                    type="text"
                    placeholder="不填将自动生成"
                    maxlength="20"
                />
            </view>

            <view class="form-item">
                <text class="label">密码</text>
                <input
                    v-model="password"
                    class="input"
                    type="password"
                    placeholder="6-32 位密码"
                    maxlength="32"
                />
            </view>

            <view class="form-item">
                <text class="label">确认密码</text>
                <input
                    v-model="confirmPassword"
                    class="input"
                    type="password"
                    placeholder="请再次输入密码"
                    maxlength="32"
                />
            </view>

            <button
                class="register-btn"
                :loading="isLoading"
                @click="handleRegister"
            >
                注册
            </button>

            <view class="bottom-links">
                <text class="link" @click="goLogin">已有账号？去登录</text>
                <text class="link forgot" @click="goForgotPassword">忘记密码？</text>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.register-container {
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
    margin-bottom: 24rpx;
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

.tab-bar {
    display: flex;
    margin-bottom: 32rpx;
    border-bottom: 2rpx solid #f0f0f0;
}

.tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    font-size: 28rpx;
    color: #999;
    position: relative;

    &.active {
        color: var(--theme-primary);
        font-weight: 500;

        &::after {
            content: '';
            position: absolute;
            bottom: -2rpx;
            left: 25%;
            width: 50%;
            height: 4rpx;
            background-color: var(--theme-primary);
        }
    }
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

.register-btn {
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
    justify-content: space-between;
    margin-top: 24rpx;
}

.link {
    font-size: 26rpx;
    color: var(--theme-primary);
}

.forgot {
    color: #999;
}
</style>
