<script setup>
import { onMounted, ref, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import defaultAvatar from '@/assets/image/default.png'
import { getChatRecord } from '@/api/friends'
import { timeAgo } from '@/utils/timeFormat'
import { useUserStore, useSocketStore } from '@/stores'
import { handleInputFocus, handleInputBlur, scrollToBottom, isScrolledToBottom } from '@/utils/move'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()

const socketStore = useSocketStore()

const route = useRoute()
const router = useRouter()

const nickname = route.query.nickname
const friendAvatarUrl = decodeURIComponent(route.query.avatarUrl || '')
const friendId = route.query.userId

const { chatMap } = storeToRefs(socketStore)

const chatRecord = ref([])
const page = ref(1)
const size = ref(20)

const showNew = ref(false)

// 聊天回调函数
const handleNewMessage = (message) => {
    // 只处理来自当前聊天对象的消息
    if (message.from_user_id === parseInt(friendId)) {
        if (message.ref_type === 'TEXT') {
            chatRecord.value.push({
                "ref_type": 'TEXT',
                "fromId": message.from_user_id,
                "toId": userStore.userInfo.id,
                "content": message.content,
                "createdAt": message.created_at
            })
        } else {
            chatRecord.value.push({
                "ref_type": message.ref_type,
                "itemId": message.forward_item_id,
                "fromId": message.from_user_id,
                "toId": userStore.userInfo.id,
                "createdAt": message.created_at,
                "id": message.forward_item_info.id,
                "title": message.forward_item_info.title,
                "content": message.forward_item_info.content_preview,
                "file": message.forward_item_info.preview_file_url,
                "authorNickname": message.forward_item_info.author_nickname,
                "authorAvatar": message.forward_item_info.author_avatar_url
            })
        }

        if (!isScrolledToBottom([
            document.querySelector('.container'),
            document.querySelector('.van-pull-refresh__track'),
            document.querySelector('.van-pull-refresh'),
            document.documentElement,
            document.body
        ])) {
            showNew.value = true
            setTimeout(() => {
                showNew.value = false
            }, 3000)
        } else {
            setTimeout(() => {
                scrollToBottom([
                    '.van-pull-refresh__track',
                    '.container',
                    '.van-pull-refresh'
                ])
            }, 50)
        }
    }
}

onMounted(async () => {
    // 注册聊天回调
    socketStore.registerChatCallback(parseInt(friendId), handleNewMessage)

    const { data: { data } } = await getChatRecord({
        page: page.value,
        size: size.value,
        friendId: friendId
    })

    data.list = data.list.map(item => {
        const obj = JSON.parse(item.content)
        if (obj.type === 'TEXT') {
            item.content = obj.text
            item.ref_type = obj.type
            return item
        } else {
            return {
                ...item,
                ref_type: obj.type,
                itemId: obj.itemId,
                title: obj.title,
                content: obj.content,
                file: obj.files[0]?.url || '',
                id: obj.id,
                authorNickname: obj.author.nickname,
                authorAvatar: obj.author.avatarUrl
            }
        }
    })

    chatRecord.value = data.list.slice().reverse()


    nextTick(() => {
        setTimeout(() => {
            scrollToBottom([
                '.van-pull-refresh__track',
                '.container',
                '.van-pull-refresh'
            ])
        }, 300)
    })
})

watch(chatRecord, () => {
    const chatEntry = chatMap.value.get(parseInt(friendId))
    if (chatEntry) {
        chatEntry.cnt = 0
        chatEntry.status = 'READ'
        chatMap.value.set(parseInt(friendId), chatEntry)
    }
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
        "ref_type": 'TEXT',
        'fromId': userStore.userInfo.id,
        'toId': friendId,
        'content': content.value,
        'createdAt': new Date().toISOString()
    })
    chatMap.value.set(parseInt(friendId), {
        ref_type: 'TEXT',
        type: 'private_message',
        from_user_id: parseInt(friendId),
        from_user_nickname: nickname,
        from_user_avatar: friendAvatarUrl,
        content: content.value,
        cnt: 0,
        status: 'READ'
    })
    content.value = ''
    // 发送消息后立即滚动
    setTimeout(() => {
        scrollToBottom([
            '.van-pull-refresh__track',
            '.container',
            '.van-pull-refresh'
        ])
    }, 50)
}

const handleNew = () => {
    setTimeout(() => {
        scrollToBottom([
            '.van-pull-refresh__track',
            '.container',
            '.van-pull-refresh'
        ])
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

                    <div v-if="item.fromId !== userStore.userInfo.id" class="avatar"
                        @click="router.push(`/user/${friendId}`)">
                        <img :src="friendAvatarUrl || defaultAvatar" class="avatar-image" />
                    </div>
                    <div v-else class="avatar" @click="router.push(`/user/${userStore.userInfo.id}`)">
                        <img :src="userStore.userInfo.avatar || defaultAvatar" class="avatar-image" />
                    </div>

                    <div class="content">
                        <div class="text" v-if="item.ref_type === 'TEXT'">{{ item.content }}</div>
                        <div class="share" v-else-if="item.ref_type === 'POST'"
                            @click="router.push(`/posts/detail/${item.itemId}`)">
                            <div class="post-container">
                                <strong class="share-type">分享动态</strong>
                                <div class="user-info">
                                    <div class="share-avatar">
                                        <img :src="item.authorAvatar || defaultAvatar" class="share-avatar-image" />
                                    </div>
                                    <div class="share-author">{{ item.authorNickname }}</div>
                                </div>
                                <div class="share-title">{{ item.title }}</div>
                                <div class="share-content">{{ item.content }}</div>
                                <div class="share-file" v-if="item.file">
                                    <img :src="item.file" class="share-file-image" />
                                </div>
                            </div>
                        </div>
                        <div class="share" v-else-if="item.ref_type === 'TASK'"
                            @click="router.push(`/task/detail/${item.itemId}`)">
                            <div class="task-container">
                                <strong class="share-type">分享任务</strong>
                                <div class="user-info">
                                    <div class="share-avatar">
                                        <img :src="item.authorAvatar || defaultAvatar" class="share-avatar-image" />
                                    </div>
                                    <div class="share-author">{{ item.authorNickname }}</div>
                                </div>
                                <div class="share-title">{{ item.title }}</div>
                                <div class="share-content">{{ item.content }}</div>
                                <div class="share-file" v-if="item.file">
                                    <img :src="item.file" class="share-file-image" />
                                </div>
                            </div>
                        </div>
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

            .text,
            .share {
                padding: 10px 15px;
                border-radius: 10px;
                word-wrap: break-word; // 优先保持单词完整性
                word-break: break-all; // 必要时可以在任何字符间换行
                max-width: 100%;
                font-size: 16px;

                color: black;

                .post-container,
                .task-container {
                    padding: 20px;
                    background-color: white;
                    border-radius: 20px;

                    .share-type {
                        font-size: 16px;
                        margin-bottom: 5px;
                    }

                    .user-info {
                        display: flex;
                        margin-top: 10px;
                        margin-bottom: 10px;
                        align-items: center;

                        .share-avatar-image {
                            width: 30px;
                            height: 30px;
                            object-fit: cover;
                            border-radius: 50%;
                            margin-right: 10px;
                        }

                        .share-author {
                            font-size: 14px;
                            font-weight: bold;
                        }
                    }
                }

                .share-title {
                    font-size: 16px;
                    font-weight: bold;
                }

                .share-content {
                    font-size: 12px;
                }

                .share-file-image {
                    width: 150px;
                    height: 150px;
                    border-radius: 10px;
                    object-fit: cover;
                    margin-top: 5px;
                }
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

                .text,
                .share {
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

                .text,
                .share {
                    background-color: #60a5fa;
                    color: white;
                    border-top-right-radius: 0px;
                }

                .share {
                    text-align: left;
                    color: black;
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