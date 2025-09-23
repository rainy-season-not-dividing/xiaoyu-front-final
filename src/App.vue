<script setup>
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()

// 处理 token 过期
const handleTokenExpired = () => {
  // 显示提示或执行其他逻辑
  showToast('Token 已过期，需要重新登录')

  // 跳转到登录页
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('tokenExpired', handleTokenExpired)
})

onUnmounted(() => {
  window.removeEventListener('tokenExpired', handleTokenExpired)
})
</script>

<template>
  <router-view></router-view>
</template>

<style lang="less" scoped></style>
