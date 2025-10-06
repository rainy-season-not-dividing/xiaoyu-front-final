import './assets/css/main.css'

import { createApp } from 'vue'
import pinia from './stores'

import App from './App.vue'
import router from './router'

import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSocketStore, useUserStore } from '@/stores'
import keyboardDirective from './directives/keyboard'
import '@/assets/css/my-icon/iconfont.css'
import { showMessage } from '@/utils/message'

const app = createApp(App)

app.use(pinia)
app.use(router)

// 初始化用户 store 的 token 清理功能
const userStore = useUserStore()
userStore.initTokenCleanup()

// 初始化WebSocket store，但不立即连接
const socketStore = useSocketStore()

// 监听用户token变化，有token时自动连接WebSocket
watch(
    () => userStore.token,
    (newToken) => {
        if (newToken) {
            // 有token时连接WebSocket
            socketStore.setToken(newToken)
            socketStore.connect()
        } else {
            // 没有token时断开连接
            socketStore.disconnect()
        }
    },
    { immediate: true },
)

const { latest, displayList } = storeToRefs(socketStore)

// 监听displayList变化，自动保存到本地
watch(
    displayList,
    (newDisplayList) => {
        if (newDisplayList.length && window.android && typeof window.android.saveDisplayListToLocal === 'function') {
            try {
                // 将displayList转为JSON字符串（原生仅支持基本类型参数）
                const displayListStr = JSON.stringify(newDisplayList)
                // 调用原生方法保存
                window.android.saveDisplayListToLocal(displayListStr)
            } catch (e) {
                console.error('保存展示列表到本地失败：', e)
            }
        } else {
            console.log('没有展示列表数据，不保存到本地')
        }
    },
    { deep: true }
)

router.isReady().then(() => {
    router.afterEach(() => {
        // 每次路由跳转后滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
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

        // 使用 router.currentRoute.value 获取当前路由信息
        const currentRoute = router.currentRoute.value
        // 安全地检查路由信息
        const routePath = currentRoute.path || ''
        const routeUserId = currentRoute.query.userId || ''

        if (msg && (routePath !== '/chat' || parseInt(routeUserId) !== msg.from_user_id)) {
            showMessage({
                avatarUrl: msg.from_user_avatar,
                nickname: msg.from_user_nickname,
                message: msg.content,
                onClick: () => {
                    router.push({
                        path: '/chat',
                        query: {
                            userId: msg.from_user_id,
                            nickname: msg.from_user_nickname,
                            avatarUrl: encodeURIComponent(msg.from_user_avatar),
                        }
                    })
                    latest.value.status = 'READ'
                    latest.value.cnt = 0
                }
            })
        }
    })
})

// 注册全局自定义指令
app.directive('keyboard', keyboardDirective)

app.mount('#app')
