<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <text class="page-title">订单中心</text>
            <text class="page-subtitle">查看订单历史</text>
        </view>

        <!-- 标签页 -->
        <view class="tabs-section">
            <view class="tabs">
                <view
                    v-for="tab in statusTabs"
                    :key="tab.key"
                    class="tab-item"
                    :class="{ active: currentStatus === tab.key }"
                    @tap="handleStatusChange(tab.key)"
                >
                    <text>{{ tab.label }}</text>
                </view>
            </view>
        </view>

        <!-- 订单列表 -->
        <view class="orders-list">
            <view
                v-for="order in filteredOrders"
                :key="order.id"
                class="order-card"
                @tap="handleOrderDetail(order)"
            >
                <view class="order-header">
                    <text class="order-id">订单号：{{ order.orderNo }}</text>
                    <view class="order-status" :class="order.status">
                        <text>{{ getStatusLabel(order.status) }}</text>
                    </view>
                </view>

                <view v-if="!isAdmin" class="order-sub-header">
                    <text class="order-user">下单人：{{ order.userNickname }}</text>
                </view>

                <view class="order-items">
                    <view
                        v-for="item in order.items"
                        :key="item.id"
                        class="order-item"
                    >
                        <view class="item-info">
                            <text class="item-name">{{ item.dishName }}</text>
                            <text class="item-qty">x{{ item.quantity }}</text>
                        </view>
                        <text class="item-price">¥{{ item.subtotal }}</text>
                    </view>
                </view>

                <view class="order-footer">
                    <view class="order-time">
                        <text>{{ formatTime(order.createdAt) }}</text>
                    </view>
                    <view class="order-summary">
                        <text class="summary-points" v-if="order.totalPoints > 0">+{{ order.totalPoints }}积分</text>
                        <text class="summary-amount">¥{{ order.totalAmount }}</text>
                    </view>
                </view>

                <!-- 操作按钮 -->
                <view class="order-actions" @tap.stop>
                    <!-- 管理员：待接单 → 备菜中 -->
                    <view
                        v-if="isAdmin && order.status === 'pending'"
                        class="action-btn confirm"
                        @tap="handleConfirm(order)"
                    >
                        <text>接单</text>
                    </view>
                    <!-- 管理员：备菜中 → 已完成 -->
                    <view
                        v-if="isAdmin && order.status === 'confirmed'"
                        class="action-btn complete"
                        @tap="handleComplete(order)"
                    >
                        <text>完成</text>
                    </view>
                    <!-- 管理员：可取消待接单/备菜中 -->
                    <view
                        v-if="isAdmin && (order.status === 'pending' || order.status === 'confirmed')"
                        class="action-btn cancel"
                        @tap="handleCancel(order)"
                    >
                        <text>取消</text>
                    </view>
                    <!-- 下单者：可取消自己的待接单订单 -->
                    <view
                        v-if="!isAdmin && order.status === 'pending' && order.userId === currentUserId"
                        class="action-btn cancel"
                        @tap="handleCancel(order)"
                    >
                        <text>取消订单</text>
                    </view>
                </view>
            </view>

            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <view v-else-if="filteredOrders.length === 0" class="empty-state">
                <text class="empty-icon">📋</text>
                <text class="empty-text">暂无订单</text>
                <text class="empty-hint">去点餐页下单吧</text>
            </view>
        </view>

        <CustomTabBar />
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import CustomTabBar from '@/components/custom-tab-bar/index.vue'
import { onShow } from '@dcloudio/uni-app'
import * as orderApi from '@/api/order'
import type { Order, OrderStatus } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待接单' },
    { key: 'confirmed', label: '备菜中' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
]
const currentStatus = ref('all')

const orders = ref<Order[]>([])
const loading = ref(false)

const isAdmin = computed(() => userStore.isAdmin())
const familyId = computed(() => userStore.familyId)
const currentUserId = computed(() => userStore.userId)

const filteredOrders = computed(() => {
    if (currentStatus.value === 'all') return orders.value
    return orders.value.filter(o => o.status === currentStatus.value)
})

onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    await loadOrders()
})

async function loadOrders() {
    if (!familyId.value) return
    loading.value = true
    try {
        orders.value = await orderApi.listOrders(familyId.value)
    } catch (err) {
        // ignore
    } finally {
        loading.value = false
    }
}

const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
        pending: '待接单',
        confirmed: '备菜中',
        completed: '已完成',
        cancelled: '已取消',
    }
    return labels[status] || status
}

const formatTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso.replace(' ', 'T'))
    const now = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return `今天 ${hh}:${mm}`
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}

const handleStatusChange = (key: string) => {
    currentStatus.value = key
}

const handleOrderDetail = (order: Order) => {
    const itemsText = order.items.map(i => `${i.dishName} x${i.quantity} - ¥${i.subtotal}`).join('\n')
    uni.showModal({
        title: `订单 ${order.orderNo}`,
        content: `下单人：${order.userNickname}\n下单时间：${formatTime(order.createdAt)}\n状态：${getStatusLabel(order.status)}${order.remark ? `\n备注：${order.remark}` : ''}\n\n菜品明细：\n${itemsText}\n\n积分：+${order.totalPoints}\n合计：¥${order.totalAmount}`,
        showCancel: false,
    })
}

const handleConfirm = (order: Order) => {
    uni.showModal({
        title: '确认接单',
        content: `确认接单 "${order.orderNo}" 吗？订单将进入备菜中。`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await orderApi.confirmOrder(familyId.value, order.id)
                    uni.showToast({ title: '已接单', icon: 'success' })
                    await loadOrders()
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}

const handleComplete = (order: Order) => {
    uni.showModal({
        title: '确认完成',
        content: `确认完成订单 "${order.orderNo}" 吗？将发放下单者积分奖励。`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await orderApi.completeOrder(familyId.value, order.id)
                    uni.showToast({ title: '订单已完成', icon: 'success' })
                    await loadOrders()
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}

const handleCancel = (order: Order) => {
    uni.showModal({
        title: '确认取消',
        content: `确认取消订单 "${order.orderNo}" 吗？库存将归还。`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await orderApi.cancelOrder(familyId.value, order.id)
                    uni.showToast({ title: '订单已取消', icon: 'success' })
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
    padding: 24rpx;
    background-color: #fff;
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
    font-size: 26rpx;
    color: #666;
    border-radius: 8rpx;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

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
    margin-bottom: 12rpx;
    padding-bottom: 12rpx;
    border-bottom: 1rpx solid #f5f5f5;
}

.order-id {
    font-size: 24rpx;
    color: #999;
}

.order-sub-header {
    margin-bottom: 12rpx;
}

.order-user {
    font-size: 24rpx;
    color: #666;
}

.order-status {
    padding: 6rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;

    &.pending {
        background-color: #fff3e0;
        color: #f0ad4e;
    }

    &.confirmed {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    &.completed {
        background-color: #e8f5e9;
        color: #4caf50;
    }

    &.cancelled {
        background-color: #f5f5f5;
        color: #999;
    }
}

.order-items {
    margin-bottom: 16rpx;
}

.order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12rpx 0;
}

.item-info {
    display: flex;
    align-items: center;
}

.item-name {
    font-size: 28rpx;
    color: #333;
    margin-right: 12rpx;
}

.item-qty {
    font-size: 24rpx;
    color: #999;
}

.item-price {
    font-size: 26rpx;
    color: #666;
}

.order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16rpx;
    border-top: 1rpx solid #f5f5f5;
}

.order-time {
    font-size: 22rpx;
    color: #999;
}

.order-summary {
    display: flex;
    align-items: baseline;
}

.summary-points {
    font-size: 22rpx;
    color: #ff9500;
    margin-right: 12rpx;
}

.summary-amount {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.order-actions {
    margin-top: 16rpx;
    display: flex;
    justify-content: flex-end;
}

.action-btn {
    padding: 12rpx 24rpx;
    border-radius: 8rpx;
    font-size: 24rpx;
    margin-left: 16rpx;

    &.confirm {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    &.complete {
        background-color: #e8f5e9;
        color: #4caf50;
    }

    &.cancel {
        background-color: #ffebee;
        color: #f44336;
    }
}

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
</style>
