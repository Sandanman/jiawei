<template>
    <view id="app" />
</template>

<script setup lang="ts">
import { reactive, provide } from 'vue'
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useThemeStore } from '@/stores/theme'

// 全局状态，供 CustomTabBar 通过 inject 获取
const appState = reactive({
    shownKey: 0,
})
provide('appState', appState)

onLaunch(() => {
    // 启动时恢复本地主题
    useThemeStore().init()
    console.log('App Launch')
})

onShow(() => {
    console.log('App Show')
    appState.shownKey++
})

onHide(() => {
    console.log('App Hide')
})
</script>

<style lang="scss">
// 全局样式：定义主题 CSS 变量默认值（page 根节点）
// 运行时由各页面根容器的 :style 内联覆盖，实现跨端换肤
page {
    --theme-primary: #ff6b35;
    --theme-primary-light: #ff8c5a;
    --theme-primary-bg: rgba(255, 107, 53, 0.1);
    --theme-primary-grad-start: #ff6b35;
    --theme-primary-grad-end: #ff8c5a;
}
</style>