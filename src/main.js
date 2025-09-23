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

// 全局只连一次
useSocketStore().connect()

const { latest } = storeToRefs(useSocketStore())

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
    showNotify({
        type: 'primary',
        duration: 3000,
        message: h('div', { style: 'display:flex;align-items:center;' }, [
            h(MessageDialogAvatar, { type: msg.type, avatarUrl: msg.from_user_avatar }),
            h('div', {}, [
                h('div', { style: 'font-weight:bold;' }, msg.from_user_nickname),
                h('div', { style: 'font-size:12px;color:#666;' }, msg.content)
            ])
        ])
    })
}
)

// 注册全局自定义指令
app.directive('keyboard', keyboardDirective)

app.mount('#app')
