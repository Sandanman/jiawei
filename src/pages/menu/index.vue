<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-left">
                <text class="page-title">菜单管理</text>
                <text class="page-subtitle">管理家庭菜单</text>
            </view>
            <view class="add-btn" @tap="handleShowAddDish">
                <text>+ 添加菜品</text>
            </view>
        </view>

        <!-- 标签页 -->
        <view class="tabs-section">
            <view class="tabs">
                <view
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab-item"
                    :class="{ active: currentTab === tab.key }"
                    @tap="handleTabChange(tab.key)"
                >
                    <text>{{ tab.label }}</text>
                </view>
            </view>
        </view>

        <!-- 菜单列表 -->
        <view v-if="currentTab === 'menu'" class="menu-list">
            <view
                v-for="dish in dishes"
                :key="dish.id"
                class="dish-card"
                :class="{ unpublished: !dish.isPublished }"
            >
                <view class="dish-image">
                    <image
                        class="dish-img"
                        :src="dish.imageUrl || '/static/default-avatar.svg'"
                        mode="aspectFill"
                    />
                    <view v-if="!dish.isPublished" class="unpublished-tag">
                        <text>已下架</text>
                    </view>
                </view>
                <view class="dish-info">
                    <view class="dish-header">
                        <text class="dish-name">{{ dish.name }}</text>
                        <text class="dish-price">¥{{ dish.price }}</text>
                    </view>
                    <text class="dish-desc">{{ dish.description }}</text>
                    <view class="dish-meta">
                        <text class="dish-category">{{ dish.category }}</text>
                        <text class="dish-points">⭐ {{ dish.points }}积分</text>
                        <text class="dish-stock">库存{{ dish.stock }}</text>
                    </view>
                </view>
                <view class="dish-actions" @tap.stop>
                    <view class="action-toggle" @tap="handleTogglePublish(dish)">
                        <text :class="dish.isPublished ? 'off-shelf' : 'on-shelf'">
                            {{ dish.isPublished ? '下架' : '上架' }}
                        </text>
                    </view>
                    <view class="action-btn" @tap="handleEditDish(dish)">
                        <text>编辑</text>
                    </view>
                    <view class="action-btn delete" @tap="handleDeleteDish(dish)">
                        <text>删除</text>
                    </view>
                </view>
            </view>

            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <view v-else-if="dishes.length === 0" class="empty-state">
                <text class="empty-icon">🍽️</text>
                <text class="empty-text">暂无菜品</text>
                <text class="empty-hint">点击右上角添加新菜品</text>
            </view>
        </view>

        <!-- 订单列表 -->
        <view v-else-if="currentTab === 'orders'" class="orders-list">
            <view
                v-for="order in orders"
                :key="order.id"
                class="order-card"
                @tap="handleOrderDetail(order)"
            >
                <view class="order-header">
                    <view class="order-user">
                        <text class="user-name">{{ order.userNickname }}</text>
                    </view>
                    <view class="order-status" :class="order.status">
                        <text>{{ getOrderStatusLabel(order.status) }}</text>
                    </view>
                </view>
                <view class="order-items">
                    <text class="items-text">{{ order.items.map(i => i.dishName).join('、') }}</text>
                </view>
                <view class="order-footer">
                    <view class="order-info">
                        <text class="order-time">{{ formatTime(order.createdAt) }}</text>
                        <text class="order-total">共 {{ order.items.length }} 件 · ¥{{ order.totalAmount }}</text>
                    </view>
                    <view class="order-actions" @tap.stop>
                        <view
                            v-if="order.status === 'pending'"
                            class="action-btn confirm"
                            @tap="handleConfirmOrder(order)"
                        >
                            <text>接单</text>
                        </view>
                        <view
                            v-if="order.status === 'confirmed'"
                            class="action-btn complete"
                            @tap="handleCompleteOrder(order)"
                        >
                            <text>完成</text>
                        </view>
                        <view
                            v-if="order.status === 'pending' || order.status === 'confirmed'"
                            class="action-btn cancel"
                            @tap="handleCancelOrder(order)"
                        >
                            <text>取消</text>
                        </view>
                    </view>
                </view>
            </view>

            <view v-if="orders.length === 0" class="empty-state">
                <text class="empty-icon">📋</text>
                <text class="empty-text">暂无订单</text>
                <text class="empty-hint">用户下单后将显示在这里</text>
            </view>
        </view>

        <!-- 添加/编辑菜品弹窗 -->
        <view v-if="showDishModal" class="modal-overlay" @tap="handleCloseDishModal">
            <view class="modal-content dish-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">{{ editingDish ? '编辑菜品' : '添加菜品' }}</text>
                    <text class="modal-close" @tap="handleCloseDishModal">×</text>
                </view>
                <scroll-view scroll-y class="modal-body">
                    <view class="form-item">
                        <text class="form-label">菜品名称 *</text>
                        <input
                            v-model="dishForm.name"
                            class="form-input"
                            placeholder="请输入菜品名称"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">菜品描述</text>
                        <textarea
                            v-model="dishForm.description"
                            class="form-textarea"
                            placeholder="请输入菜品描述"
                            rows="3"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">价格（元）*</text>
                        <input
                            v-model="dishForm.price"
                            class="form-input"
                            type="digit"
                            placeholder="请输入价格"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">所需积分</text>
                        <view class="points-select">
                            <view
                                v-for="pts in [0, 5, 10, 15, 20, 30]"
                                :key="pts"
                                class="points-option"
                                :class="{ active: dishForm.points === pts }"
                                @tap="dishForm.points = pts"
                            >
                                <text>{{ pts }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="form-item">
                        <text class="form-label">分类</text>
                        <view class="category-select">
                            <view
                                v-for="cat in categories"
                                :key="cat"
                                class="category-option"
                                :class="{ active: dishForm.category === cat }"
                                @tap="dishForm.category = cat"
                            >
                                <text>{{ cat }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="form-item">
                        <text class="form-label">库存</text>
                        <input
                            v-model="dishForm.stock"
                            class="form-input"
                            type="number"
                            placeholder="输入库存数量"
                        />
                    </view>
                    <view class="form-item">
                        <text class="form-label">图片 URL</text>
                        <input
                            v-model="dishForm.imageUrl"
                            class="form-input"
                            placeholder="可选，粘贴图片链接"
                        />
                    </view>
                    <view v-if="!editingDish" class="form-item">
                        <view class="publish-toggle" @tap="dishForm.isPublished = !dishForm.isPublished">
                            <text>{{ dishForm.isPublished ? '✓ 创建后立即上架' : '创建后保持下架' }}</text>
                        </view>
                    </view>
                </scroll-view>
                <view class="modal-footer">
                    <view class="modal-btn cancel" @tap="handleCloseDishModal">
                        <text>取消</text>
                    </view>
                    <view class="modal-btn confirm" @tap="handleSaveDish">
                        <text>{{ editingDish ? '保存' : '添加' }}</text>
                    </view>
                </view>
            </view>
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
import * as dishApi from '@/api/dish'
import * as orderApi from '@/api/order'
import type { Dish } from '@/api/types'
import type { Order, OrderStatus } from '@/api/types'

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 标签页
const tabs = [
    { key: 'menu', label: '菜单管理' },
    { key: 'orders', label: '订单管理' },
]
const currentTab = ref('menu')

// 分类
const categories = ['主食', '炒菜', '汤品', '凉菜', '饮品', '小吃']

// 菜品数据
const dishes = ref<Dish[]>([])
const loading = ref(false)

// 订单数据
const orders = ref<Order[]>([])

// 弹窗状态
const showDishModal = ref(false)
const editingDish = ref<Dish | null>(null)

// 菜品表单
const dishForm = ref({
    name: '',
    description: '',
    price: '',
    points: 10,
    category: '炒菜',
    stock: '50',
    imageUrl: '',
    isPublished: false,
})

// 是否是管理员
const isAdmin = computed(() => userStore.isAdmin())
const familyId = computed(() => userStore.familyId)

// 检查登录状态
onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    if (!isAdmin.value) {
        uni.showToast({ title: '仅管理员可访问', icon: 'none' })
        setTimeout(() => {
            uni.reLaunch({ url: '/pages/admin/index' })
        }, 1000)
        return
    }
    await loadDishes()
})

async function loadDishes() {
    if (!familyId.value) return
    loading.value = true
    try {
        dishes.value = await dishApi.listDishes(familyId.value, { includeUnpublished: true })
    } catch (err) {
        // 错误已由 http 拦截器 toast
    } finally {
        loading.value = false
    }
}

async function loadOrders() {
    if (!familyId.value) return
    try {
        orders.value = await orderApi.listOrders(familyId.value)
    } catch (err) {
        // 错误已由 http 拦截器 toast
    }
}

const getOrderStatusLabel = (status: OrderStatus) => {
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
    const sameDay = d.toDateString() === now.toDateString()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    if (sameDay) return `今天 ${hh}:${mm}`
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}

const handleTabChange = (key: string) => {
    currentTab.value = key
    if (key === 'orders') loadOrders()
}

const handleShowAddDish = () => {
    editingDish.value = null
    dishForm.value = {
        name: '',
        description: '',
        price: '',
        points: 10,
        category: '炒菜',
        stock: '50',
        imageUrl: '',
        isPublished: false,
    }
    showDishModal.value = true
}

const handleEditDish = (dish: Dish) => {
    editingDish.value = dish
    dishForm.value = {
        name: dish.name,
        description: dish.description || '',
        price: String(dish.price),
        points: dish.points,
        category: dish.category,
        stock: String(dish.stock),
        imageUrl: dish.imageUrl || '',
        isPublished: dish.isPublished,
    }
    showDishModal.value = true
}

const handleCloseDishModal = () => {
    showDishModal.value = false
    editingDish.value = null
}

const handleSaveDish = async () => {
    if (!dishForm.value.name.trim()) {
        uni.showToast({ title: '请输入菜品名称', icon: 'none' })
        return
    }
    const priceNum = Number(dishForm.value.price)
    if (!priceNum || priceNum <= 0) {
        uni.showToast({ title: '请输入有效价格', icon: 'none' })
        return
    }
    if (!familyId.value) return

    const payload = {
        familyId: familyId.value,
        name: dishForm.value.name.trim(),
        description: dishForm.value.description,
        price: priceNum,
        points: dishForm.value.points,
        category: dishForm.value.category,
        imageUrl: dishForm.value.imageUrl,
        stock: Number(dishForm.value.stock) || 0,
        isPublished: dishForm.value.isPublished,
    }

    try {
        if (editingDish.value) {
            await dishApi.updateDish(editingDish.value.id, payload)
            uni.showToast({ title: '菜品已更新', icon: 'success' })
        } else {
            await dishApi.createDish(payload)
            uni.showToast({ title: '菜品已添加', icon: 'success' })
        }
        handleCloseDishModal()
        await loadDishes()
    } catch (err) {
        // 错误已由 http 拦截器 toast
    }
}

const handleTogglePublish = async (dish: Dish) => {
    try {
        await dishApi.toggleDishPublish(dish.id, familyId.value, !dish.isPublished)
        uni.showToast({ title: dish.isPublished ? '已下架' : '已上架', icon: 'success' })
        await loadDishes()
    } catch (err) {
        // ignore
    }
}

const handleDeleteDish = (dish: Dish) => {
    uni.showModal({
        title: '确认删除',
        content: `确定要删除 "${dish.name}" 吗？`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await dishApi.deleteDish(familyId.value, dish.id)
                    uni.showToast({ title: '菜品已删除', icon: 'success' })
                    await loadDishes()
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}

const handleOrderDetail = (order: Order) => {
    uni.showModal({
        title: '订单详情',
        content: `下单人：${order.userNickname}\n时间：${formatTime(order.createdAt)}\n状态：${getOrderStatusLabel(order.status)}\n\n菜品：\n${order.items.map(i => `${i.dishName} x${i.quantity}`).join('\n')}\n\n合计：¥${order.totalAmount} + ${order.totalPoints}积分`,
        showCancel: false,
    })
}

const handleConfirmOrder = (order: Order) => {
    uni.showModal({
        title: '确认接单',
        content: `确认接单 "${order.userNickname}" 的订单吗？`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    await orderApi.confirmOrder(familyId.value, order.id)
                    uni.showToast({ title: '已接单，准备备菜', icon: 'success' })
                    await loadOrders()
                } catch (err) {
                    // ignore
                }
            }
        },
    })
}

const handleCompleteOrder = (order: Order) => {
    uni.showModal({
        title: '确认完成',
        content: `确认完成该订单吗？`,
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

const handleCancelOrder = (order: Order) => {
    uni.showModal({
        title: '确认取消',
        content: `确认取消该订单吗？库存将归还。`,
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
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

.add-btn {
    padding: 16rpx 28rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 24rpx;
    font-size: 26rpx;
}

// 标签页
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
    font-size: 28rpx;
    color: #666;
    border-radius: 8rpx;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

// 菜品列表
.menu-list {
    padding: 0 24rpx;
}

.dish-card {
    display: flex;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;

    &.unpublished {
        opacity: 0.6;
    }
}

.dish-image {
    position: relative;
    margin-right: 16rpx;
}

.dish-img {
    width: 140rpx;
    height: 140rpx;
    border-radius: 12rpx;
    background-color: #f0f0f0;
}

.unpublished-tag {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 4rpx 10rpx;
    border-radius: 6rpx;
    font-size: 20rpx;
}

.dish-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.dish-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
}

.dish-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
}

.dish-price {
    font-size: 32rpx;
    font-weight: bold;
    color: var(--theme-primary);
}

.dish-desc {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
    display: block;
}

.dish-meta {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.dish-category {
    font-size: 22rpx;
    color: #666;
    padding: 4rpx 12rpx;
    background-color: #f5f5f5;
    border-radius: 6rpx;
}

.dish-points {
    font-size: 22rpx;
    color: var(--theme-primary);
}

.dish-stock {
    font-size: 22rpx;
    color: #999;
}

.dish-actions {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-left: 12rpx;
}

.action-toggle {
    padding: 10rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    text-align: center;
}

.on-shelf {
    background-color: #e8f5e9;
    color: #4caf50;
}

.off-shelf {
    background-color: #fff3e0;
    color: #f0ad4e;
}

.action-btn {
    padding: 10rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    background-color: #f5f5f5;
    color: #666;
    text-align: center;

    &.delete {
        background-color: #ffebee;
        color: #f44336;
    }

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

// 订单列表
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
    margin-bottom: 16rpx;
}

.order-user {
    display: flex;
    align-items: center;
}

.user-name {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
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
    padding: 16rpx 0;
    border-top: 1rpx solid #f5f5f5;
    border-bottom: 1rpx solid #f5f5f5;
}

.items-text {
    font-size: 26rpx;
    color: #666;
}

.order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
}

.order-info {
    display: flex;
    flex-direction: column;
}

.order-time {
    font-size: 22rpx;
    color: #999;
    margin-bottom: 4rpx;
}

.order-total {
    font-size: 26rpx;
    color: #333;
}

.order-actions {
    display: flex;
    gap: 12rpx;
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
    font-size: 30rpx;
    color: #666;
    margin-bottom: 12rpx;
}

.empty-hint {
    font-size: 24rpx;
    color: #999;
}

// 弹窗
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
}

.dish-modal {
    width: 100%;
    max-height: 85vh;
    background-color: #fff;
    border-radius: 32rpx 32rpx 0 0;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.modal-close {
    font-size: 48rpx;
    color: #999;
    line-height: 1;
}

.modal-body {
    padding: 24rpx 32rpx;
    max-height: 60vh;
}

.modal-footer {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
    flex: 1;
    padding: 28rpx 0;
    text-align: center;
    font-size: 30rpx;

    &.cancel {
        color: #666;
        border-right: 1rpx solid #f0f0f0;
    }

    &.confirm {
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.form-item {
    margin-bottom: 24rpx;
}

.form-label {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.form-input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
}

.form-textarea {
    width: 100%;
    padding: 20rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

.points-select {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.points-option {
    flex: 1;
    min-width: 80rpx;
    padding: 16rpx 0;
    text-align: center;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.category-select {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.category-option {
    padding: 12rpx 20rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
        background-color: var(--theme-primary-bg);
        color: var(--theme-primary);
        font-weight: bold;
    }
}

.publish-toggle {
    padding: 16rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #666;
    text-align: center;
}
</style>
