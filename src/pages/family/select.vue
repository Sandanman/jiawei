<template>
    <view class="container" :style="pageStyle">
        <view class="header">
            <text class="title">选择家庭</text>
            <text class="subtitle" v-if="userStore.nickname">欢迎回来，{{ userStore.nickname }}</text>
        </view>

        <!-- 家庭列表 -->
        <view class="family-list" v-if="families.length > 0">
            <view
                class="family-card"
                v-for="fam in families"
                :key="fam.familyId"
                @click="handleSelect(fam)"
            >
                <view class="family-info">
                    <text class="family-name">{{ fam.familyName }}</text>
                    <text class="family-code">邀请码：{{ fam.familyCode }}</text>
                    <view class="family-tags">
                        <text class="tag" :class="{ 'tag-owner': fam.isOwner }">
                            {{ fam.isOwner ? '房主' : (fam.isAdmin ? '管理员' : '成员') }}
                        </text>
                        <text class="tag tag-remark" v-if="fam.adminRemark">{{ fam.adminRemark }}</text>
                    </view>
                </view>
                <view class="arrow">›</view>
            </view>
        </view>

        <!-- 空状态 -->
        <view class="empty" v-else-if="!loading">
            <text class="empty-text">你还没有加入任何家庭</text>
            <button class="btn-primary" @click="handleCreate">创建家庭</button>
        </view>

        <!-- 底部操作 -->
        <view class="footer" v-if="families.length > 0">
            <button class="btn-ghost" @click="handleCreate">+ 创建新家庭</button>
            <button class="btn-ghost" @click="handleJoin">通过邀请码加入</button>
        </view>
    </view>
</template>

<script setup lang="ts">
/**
 * 选择家庭页
 * - 展示当前用户已加入的家庭
 * - 支持创建家庭 / 通过邀请码加入
 */
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import {
    listFamilies,
    createFamily,
    joinFamily
} from '@/api/family'
import type { FamilyBrief } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

const families = ref<FamilyBrief[]>([])
const loading = ref(true)

async function loadFamilies() {
    loading.value = true
    try {
        families.value = await listFamilies()
        // 同步到 store
        if (families.value.length > 0) {
            userStore.families = families.value
            if (!userStore.familyId) {
                userStore.switchFamily(families.value[0].familyId)
            }
        }
    } catch (err) {
        console.error('[loadFamilies]', err)
    } finally {
        loading.value = false
    }
}

onMounted(loadFamilies)
// 从其他页返回时刷新
onShow(loadFamilies)

/** 选择家庭进入 */
function handleSelect(fam: FamilyBrief) {
    userStore.switchFamily(fam.familyId)
    // 管理员/房主进菜单页，普通成员进点餐页
    if (fam.isAdmin || fam.isOwner) {
        uni.reLaunch({ url: '/pages/menu/index' })
    } else {
        uni.reLaunch({ url: '/pages/order/index' })
    }
}

/** 创建家庭 */
function handleCreate() {
    uni.showModal({
        title: '创建家庭',
        editable: true,
        placeholderText: '请输入家庭名称',
        success: async (res) => {
            if (!res.confirm || !res.content || !res.content.trim()) return
            try {
                const result = await createFamily({ familyName: res.content.trim() })
                uni.showToast({ title: '创建成功', icon: 'success' })
                await loadFamilies()
                // 自动切换到新建家庭
                const newFam = families.value.find(f => f.familyId === result.familyId)
                if (newFam) handleSelect(newFam)
            } catch (err) {
                console.error('[createFamily]', err)
            }
        }
    })
}

/** 通过邀请码加入 */
function handleJoin() {
    uni.showModal({
        title: '加入家庭',
        editable: true,
        placeholderText: '请输入邀请码',
        success: async (res) => {
            if (!res.confirm || !res.content || !res.content.trim()) return
            try {
                const result = await joinFamily(res.content.trim())
                uni.showToast({ title: `已加入「${result.familyName}」`, icon: 'success' })
                await loadFamilies()
            } catch (err) {
                console.error('[joinFamily]', err)
            }
        }
    })
}
</script>

<style scoped lang="scss">
.container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 40rpx 32rpx;
    box-sizing: border-box;
}

.header {
    margin-bottom: 32rpx;

    .title {
        display: block;
        font-size: 48rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
    }

    .subtitle {
        font-size: 28rpx;
        color: #999;
    }
}

.family-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    margin-bottom: 48rpx;
}

.family-card {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 36rpx 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.family-info {
    flex: 1;
    min-width: 0;
}

.family-name {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 8rpx;
}

.family-code {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
}

.family-tags {
    display: flex;
    gap: 16rpx;
}

.tag {
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    background-color: #f0f0f0;
    color: #666;
}

.tag-owner {
    background-color: var(--theme-primary-bg);
    color: var(--theme-primary);
}

.tag-remark {
    background-color: #e6f4ff;
    color: #1677ff;
}

.arrow {
    font-size: 48rpx;
    color: #ccc;
    line-height: 1;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 200rpx;
    gap: 48rpx;

    .empty-text {
        font-size: 30rpx;
        color: #999;
    }
}

.footer {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.btn-primary {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, var(--theme-primary-grad-start) 0%, var(--theme-primary-grad-end) 100%);
    border-radius: 44rpx;
    color: #fff;
    font-size: 30rpx;
    border: none;
}

.btn-ghost {
    width: 100%;
    height: 88rpx;
    background-color: #fff;
    border: 2rpx solid var(--theme-primary);
    border-radius: 44rpx;
    color: var(--theme-primary);
    font-size: 30rpx;
}
</style>
