import { defineStore } from "pinia"
import { getUserInfo } from '@/api/user'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const token = ref('')
    const setToken = (newToken) => {
        token.value = newToken
    }

    const userInfo = ref({})
    const setUserInfo = (newUserInfo) => {
        userInfo.value = newUserInfo
    }

    // 定时器引用
    const tokenCleanupTimer = ref(null)

    // 清除 token userInfo 及定时器
    const clear = () => {
        token.value = ''
        userInfo.value = {}

        // 清除定时器
        if (tokenCleanupTimer.value) {
            clearTimeout(tokenCleanupTimer.value)
            tokenCleanupTimer.value = null
        }
    }

    // 根据实际过期时间设置清理定时器
    const setupTokenCleanup = (tokenValue) => {
        // 清除之前的定时器
        if (tokenCleanupTimer.value) {
            clearTimeout(tokenCleanupTimer.value)
            tokenCleanupTimer.value = null
        }

        if (!tokenValue) return

        try {
            // 解析 JWT token base64
            const payload = JSON.parse(atob(tokenValue.split('.')[1]))
            const exp = payload.exp * 1000
            const now = Date.now()
            const timeUntilExpiration = exp - now

            if (timeUntilExpiration > 0) {
                // 在 token 过期时自动清理
                tokenCleanupTimer.value = setTimeout(() => {
                    // 检查是否还是同一个 token
                    if (token.value === tokenValue) {
                        clearToken()
                        // 触发自定义事件通知应用
                        window.dispatchEvent(new CustomEvent('tokenExpired'))
                    }
                }, timeUntilExpiration)

                console.log(`Token 将在 ${timeUntilExpiration / 1000} 秒后过期`)
            } else {
                // token 已过期，立即清理
                clearToken()
                // 触发自定义事件通知应用
                window.dispatchEvent(new CustomEvent('tokenExpired'))
            }
        } catch (error) {
            console.error('解析 token 失败:', error)
            // 解析失败，立即清理
            clearToken()
            // 触发自定义事件通知应用
            window.dispatchEvent(new CustomEvent('tokenExpired'))
        }
    }

    // 初始化时恢复 token 并设置清理定时器
    const initTokenCleanup = () => {
        if (token.value) {
            setupTokenCleanup(token.value)
        }
    }

    return { token, setToken, userInfo, setUserInfo,clear,initTokenCleanup }
}, {
    persist: [
        {
            key: 'user-token',
            paths: ['token'],
            storage: localStorage,
            serializer: {
                serialize: (state) => {
                    // 只序列化指定的字段
                    return JSON.stringify({ token: state.token })
                },
                deserialize: (value) => {
                    return JSON.parse(value || '{}')
                }
            }
        },
        {
            key: 'user-info',
            paths: ['userInfo'],
            storage: localStorage,
            serializer: {
                serialize: (state) => {
                    // 只序列化指定的字段
                    return JSON.stringify({ userInfo: state.userInfo })
                },
                deserialize: (value) => {
                    return JSON.parse(value || '{}')
                }
            }
        }
    ]
})