import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { computed, ref } from 'vue'

export const useSocketStore = defineStore('socket', () => {
    let socket = null

    /* 三段存储 */
    const system = ref([]) // 系统
    const interactive = ref([]) // 互动
    const chatMap = new Map() // 好友（同一人覆盖）

    /* 计算属性：按「系统→互动→好友」拼死顺序 */
    const displayList = computed(() => {
        const result = []

        // 安全地添加系统消息
        if (system.value && system.value.length > 0 && system.value[0]) {
            result.push(system.value[0])
        }

        // 安全地添加互动消息
        if (interactive.value && interactive.value.length > 0 && interactive.value[0]) {
            result.push(interactive.value[0])
        }

        // 安全地添加聊天消息
        if (chatMap && chatMap.size > 0) {
            for (const message of chatMap.values()) {
                if (message) {
                    result.push(message)
                }
            }
        }

        return result
    })

    // 新增：用于存储当前聊天界面的回调函数
    const chatCallbacks = new Map()

    // 新增：注册聊天界面回调
    const registerChatCallback = (friendId, callback) => {
        chatCallbacks.set(friendId, callback)
    }

    // 新增：注销聊天界面回调
    const unregisterChatCallback = (friendId) => {
        chatCallbacks.delete(friendId)
    }

    const latest = ref(null)
    const connect = () => {
        if (socket) return


        socket = io('ws://localhost:8080/ws/messages', {
            transports: ['websocket'], // 强制走 WS
            reconnection: true,
            reconnectionDelay: 2000
        })

        socket.on('connect', () => {
            console.log('Socket.IO 已连接')
        })

        socket.on('message', (payload) => {
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
            switch (payload.type) {
                case 'SYSTEM':
                    system.value.unshift(payload)
                    break
                case 'INTERACTION':
                    interactive.value.unshift(payload)
                    break
                case 'CHAT':
                    chatMap.set(payload.from_user_id, payload)
                    const callback = chatCallbacks.get(payload.from_user_id)
                    if (callback) {
                        callback(payload) // 调用聊天界面的回调函数
                    }
                    break
            }
            latest.value = payload   // 给弹窗用
        })
    }


    // 发送私信的方法
    const sendMessage = (toId, content, tempId = null) => {
        const payload = {
            type: 'send_message',
            toId,
            content,
            tempId
        }

        socket.emit('message', payload)
    }

    return {
        connect, chatMap, displayList, latest, sendMessage, registerChatCallback, unregisterChatCallback
    }
})