<template>
    <view class="container" :style="pageStyle">
        <!-- 页面头部 -->
        <view class="page-header">
            <view class="header-left">
                <text class="page-title">点餐</text>
                <text class="page-subtitle">选择美食，积分下单</text>
            </view>
            <view class="cart-btn" @tap="handleShowCart">
                <text class="cart-icon">🛒</text>
                <view v-if="cartCount > 0" class="cart-badge">
                    <text>{{ cartCount }}</text>
                </view>
            </view>
        </view>

        <!-- 分类筛选 -->
        <view class="category-section">
            <scroll-view scroll-x class="category-scroll">
                <view class="category-list">
                    <view
                        v-for="cat in categories"
                        :key="cat"
                        class="category-item"
                        :class="{ active: currentCategory === cat }"
                        @tap="handleCategoryChange(cat)"
                    >
                        <text>{{ cat }}</text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 菜品列表 -->
        <view class="dish-list">
            <view
                v-for="dish in filteredDishes"
                :key="dish.id"
                class="dish-card"
                @tap="handleDishDetail(dish)"
            >
                <view class="dish-image">
                    <image
                        class="dish-img"
                        :src="dish.imageUrl || '/static/default-avatar.svg'"
                        mode="aspectFill"
                    />
                </view>
                <view class="dish-info">
                    <text class="dish-name">{{ dish.name }}</text>
                    <text class="dish-desc">{{ dish.description }}</text>
                    <view class="dish-footer">
                        <view class="dish-price-info">
                            <text class="dish-price">¥{{ dish.price }}</text>
                            <text class="dish-points">+{{ dish.points }}积分</text>
                        </view>
                        <view class="dish-stock" v-if="dish.stock <= 10">
                            <text>仅剩{{ dish.stock }}份</text>
                        </view>
                    </view>
                </view>
                <view class="dish-action" @tap.stop>
                    <view v-if="dish.stock > 0" class="add-btn" @tap="handleAddToCart(dish)">
                        <text>+</text>
                    </view>
                    <view v-else class="sold-out">
                        <text>售罄</text>
                    </view>
                </view>
            </view>

            <view v-if="loading" class="empty-state">
                <text class="empty-text">加载中...</text>
            </view>
            <view v-else-if="filteredDishes.length === 0" class="empty-state">
                <text class="empty-icon">🍽️</text>
                <text class="empty-text">暂无菜品</text>
                <text class="empty-hint">管理员正在准备中</text>
            </view>
        </view>

        <!-- 购物车浮窗 -->
        <view v-if="cartCount > 0" class="cart-float" @tap="handleShowCart">
            <view class="cart-info">
                <text class="cart-total">¥{{ cartTotal }}</text>
                <text class="cart-points">+{{ cartPoints }}积分</text>
            </view>
            <view class="cart-checkout">
                <text>去结算</text>
            </view>
        </view>

        <!-- 购物车弹窗 -->
        <view v-if="showCartModal" class="modal-overlay" @tap="handleCloseCart">
            <view class="modal-content cart-modal" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">购物车</text>
                    <text class="modal-close" @tap="handleCloseCart">×</text>
                </view>
                <view class="modal-body">
                    <view v-if="cart.length > 0" class="cart-list">
                        <view
                            v-for="item in cart"
                            :key="item.dishId"
                            class="cart-item"
                        >
                            <view class="cart-item-info">
                                <text class="cart-item-name">{{ item.name }}</text>
                                <text class="cart-item-price">¥{{ item.price }} + {{ item.points }}积分</text>
                            </view>
                            <view class="cart-item-actions">
                                <view class="quantity-btn" @tap="handleDecrease(item)">
                                    <text>-</text>
                                </view>
                                <text class="quantity-num">{{ item.quantity }}</text>
                                <view class="quantity-btn" @tap="handleIncrease(item)">
                                    <text>+</text>
                                </view>
                            </view>
                        </view>
                    </view>
                    <view v-else class="cart-empty">
                        <text>购物车是空的</text>
                    </view>
                </view>
                <view class="modal-footer">
                    <view class="cart-summary">
                        <view class="summary-left">
                            <text class="summary-label">合计</text>
                            <view class="summary-value">
                                <text class="summary-amount">¥{{ cartTotal }}</text>
                                <text class="summary-points">+{{ cartPoints }}积分</text>
                            </view>
                        </view>
                        <view class="summary-balance">
                            <text>剩余积分：{{ userPoints }}</text>
                        </view>
                    </view>
                    <view class="remark-row">
                        <input
                            v-model="remark"
                            class="remark-input"
                            placeholder="备注（可选）"
                        />
                    </view>
                    <view
                        class="checkout-btn"
                        :class="{ disabled: cart.length === 0 || submitting }"
                        @tap="handleCheckout"
                    >
                        <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
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

const userStore = useUserStore()
const themeStore = useThemeStore()
// 页面根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 分类
const categories = ['全部', '主食', '炒菜', '汤品', '凉菜', '饮品', '小吃']
const currentCategory = ref('全部')

const dishes = ref<Dish[]>([])
const loading = ref(false)
const submitting = ref(false)

// 购物车
interface CartItem {
    dishId: number
    name: string
    price: number
    points: number
    quantity: number
}

const cart = ref<CartItem[]>([])
const showCartModal = ref(false)
const remark = ref('')

const familyId = computed(() => userStore.familyId)
const userPoints = computed(() => userStore.getCurrentPoints || 0)

// 筛选菜品：仅展示上架且有库存
const filteredDishes = computed(() => {
    const published = dishes.value.filter(d => d.isPublished)
    if (currentCategory.value === '全部') return published
    return published.filter(d => d.category === currentCategory.value)
})

const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const cartPoints = computed(() => cart.value.reduce((sum, item) => sum + item.points * item.quantity, 0))

onShow(async () => {
    if (!userStore.isLogin) {
        uni.redirectTo({ url: '/pages/login/index' })
        return
    }
    await loadDishes()
})

async function loadDishes() {
    if (!familyId.value) return
    loading.value = true
    try {
        dishes.value = await dishApi.listDishes(familyId.value)
    } catch (err) {
        // ignore
    } finally {
        loading.value = false
    }
}

const handleCategoryChange = (category: string) => {
    currentCategory.value = category
}

const handleDishDetail = (dish: Dish) => {
    uni.showModal({
        title: dish.name,
        content: `${dish.description || ''}\n\n价格：¥${dish.price} + ${dish.points}积分\n库存：${dish.stock}份`,
        showCancel: true,
        confirmText: '加入购物车',
        success: (res) => {
            if (res.confirm) {
                handleAddToCart(dish)
            }
        },
    })
}

const handleAddToCart = (dish: Dish) => {
    const existing = cart.value.find(item => item.dishId === dish.id)
    if (existing) {
        existing.quantity++
    } else {
        cart.value.push({
            dishId: dish.id,
            name: dish.name,
            price: dish.price,
            points: dish.points,
            quantity: 1,
        })
    }
    uni.showToast({ title: '已加入购物车', icon: 'success' })
}

const handleIncrease = (item: CartItem) => {
    item.quantity++
}

const handleDecrease = (item: CartItem) => {
    if (item.quantity > 1) {
        item.quantity--
    } else {
        const idx = cart.value.findIndex(c => c.dishId === item.dishId)
        if (idx !== -1) cart.value.splice(idx, 1)
    }
}

const handleShowCart = () => {
    showCartModal.value = true
}

const handleCloseCart = () => {
    showCartModal.value = false
}

const handleCheckout = () => {
    if (cart.value.length === 0) {
        uni.showToast({ title: '购物车是空的', icon: 'none' })
        return
    }
    if (submitting.value) return

    uni.showModal({
        title: '确认下单',
        content: `合计：¥${cartTotal.value} + ${cartPoints.value}积分\n\n确认提交订单吗？`,
        success: async (res) => {
            if (res.confirm) {
                submitting.value = true
                try {
                    await orderApi.createOrder({
                        familyId: familyId.value,
                        items: cart.value.map(c => ({ dishId: c.dishId, quantity: c.quantity })),
                        remark: remark.value || undefined,
                    })
                    uni.showToast({ title: '下单成功', icon: 'success' })
                    cart.value = []
                    remark.value = ''
                    handleCloseCart()
                    setTimeout(() => {
                        uni.switchTab({ url: '/pages/orders/index' })
                    }, 1200)
                } catch (err) {
                    // ignore
                } finally {
                    submitting.value = false
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

.cart-btn {
    position: relative;
    padding: 16rpx;
}

.cart-icon {
    font-size: 48rpx;
}

.cart-badge {
    position: absolute;
    top: 8rpx;
    right: 4rpx;
    min-width: 36rpx;
    height: 36rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    padding: 0 8rpx;
}

.category-section {
    padding: 0 24rpx;
    margin-bottom: 20rpx;
}

.category-scroll {
    white-space: nowrap;
}

.category-list {
    display: flex;
    padding: 4rpx;
    background-color: #fff;
    border-radius: 12rpx;
    width: max-content;
}

.category-item {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    padding: 16rpx 24rpx;
    font-size: 26rpx;
    color: #666;
    border-radius: 8rpx;
    white-space: nowrap;

    text {
        white-space: nowrap;
    }

    &.active {
        background-color: var(--theme-primary);
        color: #fff;
    }
}

.dish-list {
    padding: 0 24rpx;
}

.dish-card {
    display: flex;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
}

.dish-image {
    margin-right: 16rpx;
}

.dish-img {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background-color: #f0f0f0;
}

.dish-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.dish-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
}

.dish-desc {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 12rpx;
    display: block;
}

.dish-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dish-price-info {
    display: flex;
    align-items: baseline;
}

.dish-price {
    font-size: 32rpx;
    font-weight: bold;
    color: var(--theme-primary);
    margin-right: 8rpx;
}

.dish-points {
    font-size: 22rpx;
    color: #ff9500;
}

.dish-stock {
    font-size: 22rpx;
    color: #f44336;
    padding: 4rpx 12rpx;
    background-color: #ffebee;
    border-radius: 8rpx;
}

.dish-action {
    display: flex;
    align-items: center;
    margin-left: 16rpx;
}

.add-btn {
    width: 56rpx;
    height: 56rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    font-weight: bold;
}

.sold-out {
    padding: 12rpx 20rpx;
    background-color: #f5f5f5;
    color: #999;
    border-radius: 8rpx;
    font-size: 24rpx;
}

.cart-float {
    position: fixed;
    bottom: 120rpx;
    left: 24rpx;
    right: 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #333;
    border-radius: 48rpx;
    padding: 20rpx 32rpx;
    z-index: 100;
}

.cart-info {
    display: flex;
    flex-direction: column;
}

.cart-total {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
}

.cart-points {
    font-size: 24rpx;
    color: #ff9500;
}

.cart-checkout {
    padding: 16rpx 40rpx;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 32rpx;
    font-size: 28rpx;
    font-weight: bold;
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

.cart-modal {
    width: 100%;
    max-height: 75vh;
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
    max-height: 40vh;
}

.cart-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
}

.cart-item-info {
    flex: 1;
}

.cart-item-name {
    font-size: 28rpx;
    color: #333;
    display: block;
    margin-bottom: 6rpx;
}

.cart-item-price {
    font-size: 24rpx;
    color: var(--theme-primary);
}

.cart-item-actions {
    display: flex;
    align-items: center;
}

.quantity-btn {
    width: 56rpx;
    height: 56rpx;
    background-color: #f5f5f5;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    color: #666;
}

.quantity-num {
    min-width: 60rpx;
    text-align: center;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
}

.cart-empty {
    text-align: center;
    padding: 60rpx 0;
    color: #999;
    font-size: 28rpx;
}

.modal-footer {
    padding: 24rpx 32rpx;
    border-top: 1rpx solid #f0f0f0;
}

.cart-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
}

.summary-left {
    display: flex;
    align-items: center;
}

.summary-label {
    font-size: 28rpx;
    color: #999;
    margin-right: 12rpx;
}

.summary-value {
    display: flex;
    align-items: baseline;
}

.summary-amount {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-right: 8rpx;
}

.summary-points {
    font-size: 24rpx;
    color: #ff9500;
}

.summary-balance {
    font-size: 24rpx;
    color: #999;
}

.remark-row {
    margin-bottom: 20rpx;
}

.remark-input {
    width: 100%;
    height: 72rpx;
    padding: 0 24rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 26rpx;
    box-sizing: border-box;
}

.checkout-btn {
    padding: 28rpx 0;
    background-color: var(--theme-primary);
    color: #fff;
    border-radius: 40rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: bold;

    &.disabled {
        background-color: #ccc;
    }
}
</style>
