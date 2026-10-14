<template>
    <view class="tab-bar" :style="pageStyle">
        <!-- 管理员 TabBar -->
        <view
            v-if="isAdminRole"
            class="tab-bar-content"
        >
            <view
                v-for="(tab, index) in adminTabs"
                :key="tab.pagePath"
                class="tab-item"
                :class="{ active: currentIndex === index }"
                @tap="switchTab(tab.pagePath, index)"
            >
                <view
                    class="tab-icon"
                    :style="{ backgroundImage: `url(${currentIndex === index ? activeIcons[tab.pagePath] : inactiveIcon(tab)})` }"
                ></view>
                <text class="tab-text">{{ tab.text }}</text>
            </view>
        </view>

        <!-- 普通用户 TabBar -->
        <view
            v-else-if="isMemberRole"
            class="tab-bar-content"
        >
            <view
                v-for="(tab, index) in userTabs"
                :key="tab.pagePath"
                class="tab-item"
                :class="{ active: currentIndex === index }"
                @tap="switchTab(tab.pagePath, index)"
            >
                <view
                    class="tab-icon"
                    :style="{ backgroundImage: `url(${currentIndex === index ? activeIcons[tab.pagePath] : inactiveIcon(tab)})` }"
                ></view>
                <text class="tab-text">{{ tab.text }}</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

interface Tab {
    text: string
    paths: string
    pagePath: string
}

const userStore = useUserStore()
const themeStore = useThemeStore()
// 组件根容器样式，注入主题 CSS 变量实现换肤
const pageStyle = computed(() => themeStore.cssVars)

// 当前选中的 tab 索引
const currentIndex = ref(0)

// 角色计算属性（owner 和 admin 都显示管理端 tab bar）
const isAdminRole = computed(() => userStore.role === 'admin' || userStore.role === 'owner')
const isMemberRole = computed(() => userStore.role === 'member')

// 当前主题主色
const iconColor = computed(() => themeStore.color)

// 根据颜色生成对应颜色的 data-uri icon（feather 风格极简线条）
function makeIcon(paths: string, color: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const basePaths: Record<string, string> = {
    menu: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    members: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tasks: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>',
    points: '<circle cx="12" cy="9" r="5"/><path d="M12 14v5"/><path d="M9 19h6"/><path d="M12 19v2"/>',
    mall: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    order: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1v3"/><path d="M10 1v3"/><path d="M14 1v3"/>',
    orders: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    center: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
}

function buildTab(
    text: string,
    pagePath: string,
    key: keyof typeof basePaths
): Tab {
    return {
        text,
        pagePath,
        paths: basePaths[key],
    }
}

// 管理员 TabBar（精简为 4 个）
const adminTabs: Tab[] = [
    buildTab('菜单', '/pages/menu/index', 'menu'),
    buildTab('管理中心', '/pages/admin/index', 'center'),
    buildTab('商城', '/pages/mall/index', 'mall'),
    buildTab('我的', '/pages/profile/index', 'profile'),
]

// 普通用户 TabBar
const userTabs: Tab[] = [
    buildTab('点餐', '/pages/order/index', 'order'),
    buildTab('订单中心', '/pages/orders/index', 'orders'),
    buildTab('任务', '/pages/tasks/index', 'tasks'),
    buildTab('商城', '/pages/mall/index', 'mall'),
    buildTab('个人中心', '/pages/profile/index', 'profile'),
]

// 当前角色对应的 tab 列表（响应式）
const currentTabs = computed(() => (isAdminRole.value ? adminTabs : userTabs))

// 生成选中 icon（随主题色变化响应式）
const activeIcons = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const tab of currentTabs.value) {
        map[tab.pagePath] = makeIcon(tab.paths, iconColor.value)
    }
    return map
})

const inactiveIcon = (tab: Tab) => makeIcon(tab.paths, '#9a9a9a')

// 切换 Tab
const switchTab = (pagePath: string, index: number) => {
    if (currentIndex.value === index) return
    currentIndex.value = index
    uni.reLaunch({ url: pagePath })
}

// 更新当前高亮的索引
const updateCurrentIndex = () => {
    const pages = getCurrentPages()
    if (pages.length === 0) return

    const currentPage = pages[pages.length - 1]
    const currentPath = `/${currentPage.route}`

    // 从当前角色的 tabs 中查找匹配；无匹配时清空激活态（-1）
    const tabs = isAdminRole.value ? adminTabs : userTabs
    const idx = tabs.findIndex((t) => t.pagePath === currentPath)
    currentIndex.value = idx
}

// 页面显示时更新
onShow(() => {
    updateCurrentIndex()
})

// 组件挂载时更新
onMounted(() => {
    updateCurrentIndex()
})

// 监听 role 变化，重新计算索引
watch(
    () => userStore.role,
    async () => {
        // 角色变化后，等待路由切换完成再更新索引
        await nextTick()
        updateCurrentIndex()
    }
)
</script>

<style scoped lang="scss">
.tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #ffffff;
    border-top: 1rpx solid #f0f0f0;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 999;
}

.tab-bar-content {
    display: flex;
    flex-direction: row;
    height: 110rpx;
}

.tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10rpx 0;

    &.active .tab-text {
        color: var(--theme-primary);
    }
}

.tab-icon {
    width: 46rpx;
    height: 46rpx;
    margin-bottom: 6rpx;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    transition: opacity 0.2s;
}

.tab-text {
    font-size: 22rpx;
    color: #9a9a9a;
    transition: color 0.2s;
}
</style>
