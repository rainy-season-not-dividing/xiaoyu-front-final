<script setup>
import { useSocketStore } from '@/stores'

const socketStore = useSocketStore()
</script>

<template>
    <div class="content">
        <router-view></router-view>
    </div>
    <div class="footer">
        <van-tabbar route inactive-color="#b8b8b8">
            <van-tabbar-item icon="friends-o" to="/posts">动态</van-tabbar-item>
            <van-tabbar-item icon="bullhorn-o" to="/task">任务</van-tabbar-item>
            <van-tabbar-item icon="chat-o" to="/message" :badge="socketStore.noticeCnt || null">消息</van-tabbar-item>
            <van-tabbar-item icon="user-circle-o" to="/me">我的</van-tabbar-item>
        </van-tabbar>
    </div>
</template>

<style lang="less" scoped></style>