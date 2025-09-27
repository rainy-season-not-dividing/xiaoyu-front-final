import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 配置常量
const MAX_MESSAGES = 100 // 最大消息数量限制
const WEBSOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8080/ws/messages'
const RECONNECT_DELAY = 2000
const MAX_RECONNECT_ATTEMPTS = 5
const HEARTBEAT_INTERVAL = 30000 // 30秒心跳

export const useWebSocketStore = defineStore(
    'websocket',
    () => {
        let ws = null
        let heartbeatTimer = null
        let reconnectTimer = null
        let reconnectAttempts = 0

        /* 三段存储 */
        const system = ref([]) // 系统消息
        const interactive = ref([]) // 互动消息
        const chatMap = ref(new Map()) // 私信消息（按发送者ID存储最新消息）

        // 连接状态
        const isConnected = ref(false)
        const connectionError = ref(null)
        const userToken = ref(null) // JWT Token

        /* 计算属性：按「系统→互动→私信」拼接顺序 */
        const displayList = computed(() => {
            const result = []

            // 添加最新的系统消息（显示最新）
            if (system.value && system.value.length > 0) {
                result.push(system.value[0])
            }

            // 添加最新的互动消息（显示最新）
            if (interactive.value && interactive.value.length > 0) {
                result.push(interactive.value[0])
            }

            // 添加私信消息（每个好友的最新一条）
            if (chatMap.value && chatMap.value.size > 0) {
                for (const message of chatMap.value.values()) {
                    if (message) {
                        result.push(message)
                    }
                }
            }

            return result
        })

        // 通知数量
        const noticeCnt = computed(() => {
            let totalCnt = 0

            // 私信消息数量
            chatMap.value?.forEach((message) => {
                if (message) {
                    totalCnt += message.cnt || 0
                }
            })

            // 系统消息 + 互动消息
            totalCnt += (system.value?.length || 0) + (interactive.value?.length || 0)

            return totalCnt
        })

        // 聊天界面回调函数存储
        const chatCallbacks = new Map()

        // 注册聊天界面回调
        const registerChatCallback = (friendId, callback) => {
            chatCallbacks.set(friendId, callback)
        }

        // 注销聊天界面回调
        const unregisterChatCallback = (friendId) => {
            chatCallbacks.delete(friendId)
        }

        const latest = ref(null) // 最新消息，用于弹窗显示

        // 限制消息数量的辅助函数
        const limitMessages = (messages) => {
            if (messages.length > MAX_MESSAGES) {
                messages.splice(MAX_MESSAGES)
            }
        }

        // 设置用户Token
        const setToken = (token) => {
            userToken.value = token
        }

        // 心跳机制
        const startHeartbeat = () => {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer)
            }

            heartbeatTimer = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const heartbeatMessage = {
                        type: 'heartbeat',
                        timestamp: Date.now(),
                    }
                    ws.send(JSON.stringify(heartbeatMessage))
                }
            }, HEARTBEAT_INTERVAL)
        }

        const stopHeartbeat = () => {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer)
                heartbeatTimer = null
            }
        }

        // WebSocket连接
        const connect = (token = null) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('WebSocket已连接，无需重复连接')
                return
            }

            if (token) {
                setToken(token)
            }

            if (!userToken.value) {
                console.error('缺少JWT Token，无法连接WebSocket')
                connectionError.value = '缺少认证Token'
                return
            }

            connectionError.value = null

            try {
                // 构建WebSocket URL，支持多种Token传递方式
                const wsUrl = `${WEBSOCKET_URL}?token=${encodeURIComponent(userToken.value)}`

                ws = new WebSocket(wsUrl)

                ws.onopen = () => {
                    console.log('WebSocket连接成功')
                    isConnected.value = true
                    connectionError.value = null
                    reconnectAttempts = 0

                    // 启动心跳
                    startHeartbeat()
                }

                ws.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data)
                        handleMessage(payload)
                    } catch (error) {
                        console.error('解析WebSocket消息失败:', error, event.data)
                    }
                }

                ws.onclose = (event) => {
                    console.log('WebSocket连接关闭:', event.code, event.reason)
                    isConnected.value = false
                    stopHeartbeat()

                    // 自动重连（除非是主动关闭）
                    if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        scheduleReconnect()
                    }
                }

                ws.onerror = (error) => {
                    console.error('WebSocket连接错误:', error)
                    isConnected.value = false
                    connectionError.value = 'WebSocket连接错误'
                }
            } catch (error) {
                console.error('创建WebSocket连接失败:', error)
                connectionError.value = error.message
            }
        }

        // 处理接收到的消息
        const handleMessage = (payload) => {
            try {
                if (!payload || !payload.type) {
                    console.warn('收到无效的消息格式:', payload)
                    return
                }

                console.log('收到WebSocket消息:', payload)

                switch (payload.type) {
                    case 'notifinpm cation':
                        handleNotification(payload)
                        break
                    case 'private_message':
                        handlePrivateMessage(payload)
                        break
                    case 'heartbeat_response':
                    case 'heartbeat_ack':
                    case 'pong':
                        // 心跳响应，无需处理
                        break
                    case 'message_sent':
                        // 消息发送成功确认
                        console.log('消息发送成功:', payload)
                        break
                    case 'message_error':
                        // 消息发送失败
                        console.error('消息发送失败:', payload)
                        break
                    default:
                        console.warn('未知的消息类型:', payload.type)
                }

                // 只有通知和私信消息才更新latest，心跳消息不需要弹窗
                if (payload.type === 'notification' || payload.type === 'private_message') {
                    latest.value = payload // 更新最新消息，用于弹窗显示
                }
            } catch (error) {
                console.error('处理WebSocket消息时出错:', error)
            }
        }

        // 处理通知消息
        const handleNotification = (payload) => {
            const notificationType = payload.notification_type || 'SYSTEM'

            switch (notificationType) {
                case 'SYSTEM':
                    system.value.unshift(payload)
                    limitMessages(system.value)
                    break
                case 'INTERACTION':
                case 'AT_USER':
                case 'FRIEND_REQUEST':
                    interactive.value.unshift(payload)
                    limitMessages(interactive.value)
                    break
                default:
                    // 默认归类为互动消息
                    interactive.value.unshift(payload)
                    limitMessages(interactive.value)
            }
        }

        // 处理私信消息
        const handlePrivateMessage = (payload) => {
            const message = chatMap.value.get(payload.from_user_id)

            // 在已存在的计数基础上累加（如果没有则从0开始）
            payload.cnt = (message?.cnt || 0) + 1
            
            payload.status = 'UNREAD' // 标记为未读

            // 存储私信消息（按发送者ID存储最新消息）
            chatMap.value.set(payload.from_user_id, payload)

            // 如果有对应的聊天界面回调，则调用
            const callback = chatCallbacks.get(payload.from_user_id)
            if (callback && typeof callback === 'function') {
                callback(payload)
            }
        }

        // 重连调度
        const scheduleReconnect = () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
            }

            reconnectAttempts++
            const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1) // 指数退避

            console.log(`${delay}ms后尝试第${reconnectAttempts}次重连...`)

            reconnectTimer = setTimeout(() => {
                if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                    connect()
                } else {
                    console.error('达到最大重连次数，停止重连')
                    connectionError.value = '连接失败，请刷新页面重试'
                }
            }, delay)
        }

        // 断开连接
        const disconnect = () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }

            stopHeartbeat()

            if (ws) {
                ws.close(1000, '主动断开连接')
                ws = null
            }

            isConnected.value = false
            connectionError.value = null
            reconnectAttempts = 0
        }

        // 清理资源
        const cleanup = () => {
            disconnect()
            chatCallbacks.clear()
            system.value = []
            interactive.value = []
            chatMap.value.clear()
            latest.value = null
            userToken.value = null
        }

        // 发送私信消息
        const sendMessage = (toId, content, tempId = null) => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.error('WebSocket未连接，无法发送消息')
                return false
            }

            try {
                const payload = {
                    type: 'send_message',
                    temp_id: tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    to_id: toId,
                    content: content,
                }

                ws.send(JSON.stringify(payload))
                console.log('发送私信消息:', payload)
                return true
            } catch (error) {
                console.error('发送消息失败:', error)
                return false
            }
        }

        // 发送心跳
        const sendHeartbeat = () => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                return false
            }

            try {
                const payload = {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                }
                ws.send(JSON.stringify(payload))
                return true
            } catch (error) {
                console.error('发送心跳失败:', error)
                return false
            }
        }

        // 手动重连
        const reconnect = () => {
            disconnect()
            reconnectAttempts = 0
            connect()
        }

        return {
            // 连接管理
            connect,
            disconnect,
            reconnect,
            cleanup,
            setToken,

            // 状态
            isConnected,
            connectionError,

            // 数据
            chatMap,
            displayList,
            latest,
            system,
            interactive,
            noticeCnt,

            // 方法
            sendMessage,
            sendHeartbeat,
            registerChatCallback,
            unregisterChatCallback,
        }
    },
    {
        persist: {
            key: 'user-websocket-data',
            paths: ['system', 'interactive', 'chatMap'],
            storage: localStorage,
            serializer: {
                serialize: (state) => {
                    // 正确序列化指定的字段
                    return JSON.stringify({
                        system: state.system,
                        interactive: state.interactive,
                        chatMap: Array.from(state.chatMap.entries()), // Map转为数组进行序列化
                    })
                },
                deserialize: (value) => {
                    if (!value) return {}

                    try {
                        const parsed = JSON.parse(value)
                        // 将chatMap数组转换回Map对象
                        if (parsed.chatMap) {
                            parsed.chatMap = new Map(parsed.chatMap)
                        }
                        return parsed
                    } catch (error) {
                        console.error('反序列化失败:', error)
                        return {}
                    }
                },
            },
        },
    },
)

// 为了与main.js中的导入保持一致，添加别名导出
export const useSocketStore = useWebSocketStore
