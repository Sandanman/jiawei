<script setup lang="ts">
/**
 * 登录页 - 账号密码登录（对接后端 /api/auth/login）
 * 两步流程：
 *   1. 选择角色（管理员 / 用户）
 *   2. 输入账号密码登录，可返回重新选择角色
 */
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

type Role = 'admin' | 'user'
type Step = 'role' | 'form'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)
const step = ref<Step>('role')
const role = ref<Role>('admin')
const username = ref('')
const password = ref('')
const isLoading = ref(false)

/** 选择角色，进入表单 */
function selectRole(r: Role) {
    role.value = r
    // 预填默认账号，方便测试
    if (r === 'admin') {
        username.value = 'admin'
        password.value = 'admin'
    } else {
        username.value = ''
        password.value = ''
    }
    step.value = 'form'
}

/** 返回角色选择 */
function backToRole() {
    step.value = 'role'
    username.value = ''
    password.value = ''
}

/** 账号密码登录 */
async function handleLogin() {
    if (!username.value || !password.value) {
        uni.showToast({ title: '请输入账号和密码', icon: 'none' })
        return
    }
    if (isLoading.value) return
    isLoading.value = true
    try {
        const ok = await userStore.login(username.value, password.value)
        if (ok) {
            uni.reLaunch({ url: '/pages/family/select' })
        } else {
            uni.showToast({ title: '账号或密码错误', icon: 'none' })
        }
    } catch (err) {
        console.error('[login]', err)
    } finally {
        isLoading.value = false
    }
}

/** 跳转注册页 */
function goRegister() {
    uni.navigateTo({ url: '/pages/register/index' })
}

/** 跳转忘记密码页 */
function goForgotPassword() {
    uni.navigateTo({ url: '/pages/forgot-password/index' })
}
</script>

<template>
    <view class="login-container" :style="pageStyle">
        <!-- 顶部 Logo 区域 -->
        <view class="logo-section">
            <image class="logo" src="/static/logo.svg" mode="aspectFit" />
            <text class="app-name">家味小札</text>
            <text class="app-desc">记录家的味道，分享爱的滋味</text>
        </view>

        <!-- Step 1: 选择角色 -->
        <view class="role-section" v-if="step === 'role'">
            <button class="role-btn admin-btn" @click="selectRole('admin')">
                <text class="btn-icon">👨‍💼</text>
                <text class="btn-text">管理员登陆</text>
            </button>

            <button class="role-btn user-btn" @click="selectRole('user')">
                <text class="btn-icon">👤</text>
                <text class="btn-text">用户登录</text>
            </button>
        </view>

        <!-- Step 2: 账号密码输入 -->
        <view class="form-section" v-else>
            <view class="form-header">
                <text class="back-btn" @click="backToRole">‹</text>
                <text class="form-title">{{ role === 'admin' ? '管理员登录' : '用户登录' }}</text>
            </view>

            <view class="form-item">
                <text class="label">账号</text>
                <input
                    v-model="username"
                    class="input"
                    type="text"
                    placeholder="请输入账号"
                    maxlength="32"
                />
            </view>

            <view class="form-item">
                <text class="label">密码</text>
                <input
                    v-model="password"
                    class="input"
                    type="password"
                    placeholder="请输入密码"
                    maxlength="32"
                />
            </view>

            <button
                class="login-btn"
                :loading="isLoading"
                @click="handleLogin"
            >
                登录
            </button>

            <view class="bottom-links">
                <text class="link" @click="goRegister">新用户注册</text>
                <text class="link forgot" @click="goForgotPassword">忘记密码？</text>
            </view>
        </view>

        <!-- 底部协议 -->
        <view class="footer">
            <text class="footer-text">登录即表示同意</text>
            <text class="link">《用户协议》</text>
            <text class="footer-text">和</text>
            <text class="link">《隐私政策》</text>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.login-container {
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
    margin-bottom: 80rpx;
}

.logo {
    width: 160rpx;
    height: 160rpx;
    border-radius: 32rpx;
    background-color: rgba(255, 255, 255, 0.3);
    margin-bottom: 24rpx;
}

.app-name {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 12rpx;
}

.app-desc {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.85);
}

/* Step 1: 角色选择 */
.role-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.role-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
    background-color: #fff;
    color: #333;

    .btn-icon {
        margin-right: 12rpx;
        font-size: 36rpx;
    }
}

.admin-btn {
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.user-btn {
    background-color: rgba(255, 255, 255, 0.15);
    color: #fff;
    border: 2rpx solid rgba(255, 255, 255, 0.4);
}

/* Step 2: 表单 */
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
    /* 让标题视觉居中，抵消返回按钮宽度 */
    margin-right: 60rpx;
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

.footer {
    position: fixed;
    bottom: 60rpx;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
}

.footer-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
}

.footer .link {
    font-size: 24rpx;
    color: #fff;
    text-decoration: underline;
}
</style>
