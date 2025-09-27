<script setup>
import { onMounted, ref, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import defaultAvatar from '@/assets/image/default.png'
import { getChatRecord } from '@/api/friends'
import { timeAgo } from '@/utils/timeFormat'
import { useUserStore, useSocketStore } from '@/stores'
import { handleInputFocus, handleInputBlur } from '@/utils/moveKeyboard'

const userStore = useUserStore()

const socketStore = useSocketStore()

const route = useRoute()
const router = useRouter()

const nickname = route.query.nickname
const friendAvatarUrl = decodeURIComponent(route.query.avatarUrl || '')
const friendId = route.query.userId

const chatRecord = ref([])
const page = ref(1)
const size = ref(20)

const showNew = ref(false)

// 聊天回调函数
const handleNewMessage = (message) => {
    // 只处理来自当前聊天对象的消息
    if (message.from_user_id === parseInt(friendId)) {
        chatRecord.value.push({
            "fromId": message.from_user_id,
            "toId": userStore.userInfo.id,
            "content": message.content,
            "createdAt": message.created_at
        })
        if (!isScrolledToBottom()) {
            showNew.value = true
        } else {
            setTimeout(() => {
                scrollToBottom()
            }, 50)
        }
    }
}

// 改进的判断是否在底部的函数
const isScrolledToBottom = () => {
    // 尝试多个可能的滚动容器
    const containers = [
        document.querySelector('.container'),
        document.querySelector('.van-pull-refresh__track'),
        document.querySelector('.van-pull-refresh'),
        document.documentElement,
        document.body
    ]

    for (let container of containers) {
        if (container) {
            // 对于不同的容器类型使用不同的属性
            let scrollTop, scrollHeight, clientHeight

            if (container === document.documentElement || container === document.body) {
                // document 或 body 的滚动
                scrollTop = window.pageYOffset || document.documentElement.scrollTop
                scrollHeight = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.offsetHeight,
                    document.body.clientHeight,
                    document.documentElement.clientHeight
                )
                clientHeight = window.innerHeight || document.documentElement.clientHeight
            } else {
                // 普通元素的滚动
                scrollTop = container.scrollTop
                scrollHeight = container.scrollHeight
                clientHeight = container.clientHeight
            }

            // 检查是否在底部（允许30px误差）
            if (scrollHeight > clientHeight) { // 确保有滚动条
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30
                return isAtBottom
            }
        }
    }

    // 默认返回 true（假设在底部）
    return true
}

// 修改 scrollToBottom 函数 - 使用更精确的选择器和多重尝试
const scrollToBottom = () => {
    nextTick(() => {
        setTimeout(() => {
            // 尝试多种方式获取滚动容器
            const selectors = [
                '.van-pull-refresh__track',
                '.container',
                '.van-pull-refresh'
            ]

            for (let selector of selectors) {
                const element = document.querySelector(selector)
                if (element && element.scrollHeight > 0) {
                    element.scrollTop = element.scrollHeight
                    break
                }
            }

            // 如果上面的方法都不行，尝试直接滚动整个页面
            if (document.body.scrollHeight > window.innerHeight) {
                window.scrollTo(0, document.body.scrollHeight)
            }
        }, 100)
    })
}

onMounted(async () => {
    // 注册聊天回调
    socketStore.registerChatCallback(parseInt(friendId), handleNewMessage)

    const { data: { data } } = await getChatRecord({
        page: page.value,
        size: size.value,
        friendId: friendId
    })
    chatRecord.value = data.list.slice().reverse()

    nextTick(() => {
        setTimeout(() => {
            scrollToBottom()
        }, 300)
    })
})

const refreshing = ref(false)

const onRefresh = async () => {

    if (refreshing.value) {
        refreshing.value = false
    }

    const { data: { data } } = await getChatRecord({
        page: page.value,
        size: size.value,
        friendId: friendId
    })

    if (chatRecord.value.length >= data.pagination.total) {
        return
    }

    const reversedList = data.list.slice().reverse()

    if (page.value === 1) {
        chatRecord.value = reversedList
    } else {
        chatRecord.value.unshift(...reversedList)
    }

    ++page.value
}

const content = ref('')

const commentInput = ref(null)
const publish = async () => {
    if (!content.value.trim()) {
        return
    }
    socketStore.sendMessage(friendId, content.value)
    chatRecord.value.push({
        'fromId': userStore.userInfo.id,
        'toId': friendId,
        'content': content.value,
        'createdAt': new Date().toISOString()
    })
    content.value = ''
    // 发送消息后立即滚动
    setTimeout(() => {
        scrollToBottom()
    }, 50)
}

const handleNew = () => {
    setTimeout(() => {
        scrollToBottom()
    }, 50)
    showNew.value = false
}
</script>

<template>
    <div class="chat">
        <van-nav-bar fixed>
            <template #left>
                <van-icon name="arrow-left" @click="router.back()" color="#bdbdbd" />
                <div class="info">
                    <div class="avatar">
                        <img :src="friendAvatarUrl || defaultAvatar" class="avatar-image" />
                    </div>
                    <div class="nickname-status">
                        <div class="nickname">
                            {{ nickname }}
                        </div>
                        <div class="status">
                            正在输入...
                        </div>
                    </div>
                </div>
            </template>
        </van-nav-bar>

        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <div class="container">
                <div class="item" v-for="item in chatRecord" :key="item.id"
                    :class="{ 'self': item.fromId === userStore.userInfo.id, 'other': item.fromId !== userStore.userInfo.id }">
                    <div class="avatar">
                        <img :src="friendAvatarUrl || defaultAvatar" class="avatar-image" />
                    </div>

                    <div class="content">
                        <div class="text">{{ item.content }}</div>
                        <div class="time">
                            {{ timeAgo(item.createdAt) }}
                        </div>
                    </div>
                </div>
            </div>
        </van-pull-refresh>

        <div class="new-message" v-if="showNew" @click="handleNew">
            新消息
        </div>

        <div class="inp" v-keyboard ref="commentInput">
            <textarea v-model="content" @focus="handleInputFocus(commentInput)" @blur="handleInputBlur" />
            <div class="publish-button">
                <van-button @click="publish" type="primary">发送</van-button>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.new-message {
    text-align: center;
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 10px;
    border-radius: 15px;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    width: 70px;
    height: 30px;
}

.chat {

    .inp {
        padding: 10px;
        display: flex;
        align-items: center;
        background-color: white;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;

        textarea {
            width: 100%;
            height: 30px;
            padding-top: 3px;
            margin-right: 10px;
            background-color: #f3f4f681;
            font-size: 14px;
            border: 1px solid #f0eeee;
            border-radius: 15px;
            resize: none;
            outline: none;

            &:focus {
                border-color: #1989fa;
            }
        }

        .publish-button {
            margin-left: 10px;
        }

        :deep(.van-button) {
            width: 65px;
            height: 30px;
            border-radius: 30px;
        }
    }
}

.info {
    display: flex;
    align-items: center;

    .avatar-image {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        object-fit: cover;
        margin-left: 10px;
        margin-right: 10px;
    }

    .nickname-status {
        text-align: left;

        .nickname {
            font-size: 16px;
            font-weight: bold;
        }

        .status {
            font-size: 12px;
            color: #999;
        }
    }
}

.container {
    margin-top: 50px;
    padding: 10px;
    min-height: calc(100vh - 100px); // 确保容器有足够高度
    overflow-y: auto;

    .item {
        display: flex;
        margin-bottom: 15px;
        max-width: 100%; // 限制最大宽度

        .avatar-image {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            flex-shrink: 0; // 防止头像被压缩
        }

        .content {

            margin: 5px 10px;

            .text {
                padding: 10px 15px;
                border-radius: 10px;
                word-wrap: break-word; // 优先保持单词完整性
                word-break: break-all; // 必要时可以在任何字符间换行
                max-width: 100%;
                font-size: 16px;
            }

            .time {
                font-size: 12px;
                color: #999;
                margin-top: 5px;
                white-space: nowrap; // 时间文本不换行
            }
        }



        // 对方消息样式
        &.other {

            .content {
                .text {
                    background-color: #f0f0f0;
                    border-top-left-radius: 0;
                }
            }
        }

        // 自己发送的消息样式
        &.self {
            flex-direction: row-reverse; // 反转
            text-align: right;

            .content {

                .text {
                    background-color: #60a5fa;
                    color: white;
                    border-top-right-radius: 0px;
                }
            }
        }

        &:last-child {
            margin-bottom: 60px; // 给最后一条消息底部留出空间
        }
    }
}

:deep(.van-nav-bar) {
    padding: 5px;
}
</style>