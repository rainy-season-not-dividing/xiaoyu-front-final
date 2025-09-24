<script setup>
import { onMounted, ref, watch, nextTick } from 'vue'
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
    }
}

const chatContainer = ref(null)

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

    // 额外延时确保完全加载
    setTimeout(() => {
        scrollToBottom()
    }, 500)
})

const refreshing = ref(false)

const onRefresh = async () => {
    if (chatRecord.value.length >= data.pagination.total) {
        return
    }

    if (refreshing.value) {
        refreshing.value = false
    }

    const { data: { data } } = await getChatRecord({
        page: page.value,
        size: size.value,
        friendId: friendId
    })

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
            <div class="container" ref="chatContainer">
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

        <div class="inp" v-keyboard ref="commentInput">
            <textarea v-model="content" @focus="handleInputFocus(commentInput)" @blur="handleInputBlur" />
            <div class="publish-button">
                <van-button @click="publish" type="primary">发送</van-button>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
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