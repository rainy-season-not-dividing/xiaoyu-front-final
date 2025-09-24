import './assets/css/main.css'

import { createApp } from 'vue'
import pinia from './stores'

import App from './App.vue'
import router from './router'

import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSocketStore, useUserStore } from '@/stores'
import { showNotify, Notify } from 'vant'
import { h } from 'vue'
import 'vant/es/notify/style'
import MessageDialogAvatar from './components/MessageDialogAvatar.vue'
import keyboardDirective from './directives/keyboard'
import '@/assets/css/my-icon/iconfont.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Notify)

// 初始化用户 store 的 token 清理功能
const userStore = useUserStore()
userStore.initTokenCleanup()

// 初始化WebSocket store，但不立即连接
const socketStore = useSocketStore()

// 监听用户token变化，有token时自动连接WebSocket
watch(() => userStore.token, (newToken) => {
    if (newToken) {
        // 有token时连接WebSocket
        socketStore.setToken(newToken)
        socketStore.connect()
    } else {
        // 没有token时断开连接
        socketStore.disconnect()
    }
}, { immediate: true })

const { latest } = storeToRefs(socketStore)

// 应用关闭时清理资源
window.addEventListener('beforeunload', () => {
    socketStore.cleanup()
})

/* 只要来新消息就弹窗（列表已在 Store 自动追加） */
watch(latest, (msg) => {
    /* payload: {
                "type": "CHAT INTERACTION SYSTEM",
                "message_id": 789,
                "from_user_id": 123,
                "from_user_nickname": "张三",
                "from_user_avatar": "https://oss.example.com/avatar/123.jpg",
                "content": "你好！这是一条私信",
                "created_at": "2024-01-01 12:00:00",
                "timestamp": 1640995200000
            } */

    if (!msg) return

    // 构建通知文本内容
    const notificationText = `${msg.from_user_nickname || '系统'}: ${msg.content || '新消息'}`

    showNotify({
        type: 'primary',
        duration: 3000,
        message: notificationText
    })
}
)

// 注册全局自定义指令
app.directive('keyboard', keyboardDirective)

app.mount('#app')
