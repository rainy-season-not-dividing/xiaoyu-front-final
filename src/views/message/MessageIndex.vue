<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, watch } from 'vue'
import defaultAvatar from '@/assets/image/default.png'
import { getFriendsList } from '@/api/friends'
import { readNotice } from '@/api/notice'
import { useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'

const socketStore = useSocketStore()

const { displayList, system, interactive, chatMap } = storeToRefs(socketStore)

// 页面加载时，读取本地displayList并恢复页面数据
onMounted(() => {
    console.log('读取本地展示列表...')
    if (window.android && typeof window.android.readDisplayListFromLocal === 'function') {
        try {
            const savedDisplayListStr = window.android.readDisplayListFromLocal()
            console.log('读取本地展示列表成功：', savedDisplayListStr)
            if (savedDisplayListStr) {
                const savedDisplayList = JSON.parse(savedDisplayListStr)
                // 恢复数据到页面（关键：需根据你的数据结构反向解析）
                restoreDisplayList(savedDisplayList)
                console.log('展示列表恢复成功：', displayList.value)
            }
        } catch (e) {
            console.error('读取本地展示列表失败：', e)
        }
    } else {
        console.log('没有进行操作')
    }
})

// 恢复展示列表数据到原始数据源（需根据你的消息格式调整）
const restoreDisplayList = (savedList) => {
    // 使用 Vue 可追踪的方式清空数据
    system.value.splice(0, system.value.length)
    interactive.value.splice(0, interactive.value.length)
    chatMap.value.clear()

    // 遍历保存的列表，分别对应到system、interactive、chatMap
    savedList.forEach(item => {
        if (item.type === 'private_message') {
            chatMap.value.set(item.from_user_id, item)
        }
        if (item.notification_type === 'SYSTEM') {
            system.value = [item] // 保存最新一条
        } else if (item.notification_type === 'INTERACTION') {
            interactive.value = [item] // 保存最新一条
        }
    })
}

const isOpen = ref(false)

const router = useRouter()

const friendsList = ref([])

onMounted(async () => {
    const { data: { data } } = await getFriendsList({ page: 0, size: 0, status: 'ACCEPTED' })
    friendsList.value = data.list
})

const delChat = (friendId) => {
    // 有computered 自动更新
    chatMap.value.delete(friendId)
}

const findValueByNotificationId = (targetNotificationId) => {
    for (const value of chatMap.value.values()) {
        if (value.notificationId === targetNotificationId) {
            return value
        }
    }
    return null
}
const read = async (notificationId) => {
    await readNotice(notificationId)
    const value = findValueByNotificationId(notificationId)
    if (value) {
        value.status = 'READ'
    }
    chatMap.value.set(value.userId, value)
}

const actions = [
    { text: '添加好友', path: '/search/user' }
]
const onSelect = (action) => {
    if (action.path) {
        router.push(action.path)
    }
}

const goChat = (friendId, nickname, avatarUrl) => {
    router.push({
        path: '/chat',
        query: {
            userId: friendId,
            nickname,
            avatarUrl: encodeURIComponent(avatarUrl)
        }
    })
    const chat = chatMap.value.get(friendId)
    chat.status = 'READ'
    chat.cnt = 0
}
</script>

<template>
    <van-nav-bar title="消息" background="#f1f0f0" fixed>
        <template #right>
            <van-icon name="search" color="black" class="search-icon" @click="router.push('/search/partner')" />
            <van-popover v-model:show="isOpen" :actions="actions" @select="onSelect" placement="bottom-end">
                <template #reference>
                    <van-icon name="add-o" color="black" class="add-icon" />
                </template>
            </van-popover>
        </template>
    </van-nav-bar>

    <div class="has-friends" v-if="friendsList.length">
        <div class="avatar-scroll-container">
            <div class="avatar-scroll-wrapper">
                <div v-for="item in friendsList" :key="item.id" class="avatar-item"
                    @click="router.push(`/user/${item.friendInfo.id}`)">
                    <img :src="item.friendInfo.avatarUrl || defaultAvatar" class="avatar-image" />
                    <div class="avatar-name">{{ item.friendInfo.nickname }}</div>
                </div>
            </div>
        </div>

        <van-list v-if="displayList.length">
            <van-cell-group v-for="item in displayList" :key="item.from_user_id">
                <van-swipe-cell v-if="item.type === 'private_message'">
                    <van-cell @click="goChat(item.from_user_id, item.from_user_nickname, item.from_user_avatar)">
                        <template #title>
                            <div class="avatar-nickname">
                                <img class="custom-image" :src="item.from_user_avatar || defaultAvatar" />
                                <div class="text">
                                    <p class="custom-title">{{ item.from_user_nickname || '匿名用户' }}</p>
                                    <p class="custom-last-chat">{{ item.content }}</p>
                                </div>
                            </div>
                        </template>
                        <template #right-icon>
                            <div class="un-read" v-if="item.status === 'UNREAD'">
                                {{ item.cnt }}
                            </div>
                        </template>
                    </van-cell>

                    <template #right>
                        <van-button square text="已读" color="#c4c0c0" class="read-button" @click="read(item.id)"
                            v-if="item.status === 'UNREAD' && item.type === 'private_message'" />
                        <van-button square text="删除" type="danger" class="delete-button"
                            :class="{ 'delete-button-full': item.status === 'READ' }" @click="delChat(item.friendId)" />
                    </template>
                </van-swipe-cell>
                <van-cell v-else-if="item.notification_type === 'SYSTEM'" @click="router.push('/notice/system')" center>
                    <template #title>
                        <div class="sys">
                            <van-icon name="setting" class="system-icon" />
                            <div class="text">
                                <p class="custom-title">系统消息</p>
                                <p class="custom-last-chat">{{ item.content }}</p>
                            </div>
                        </div>
                    </template>
                    <template #right-icon>
                        <div class="un-read" v-if="socketStore.systemCnt">
                            {{ socketStore.systemCnt }}
                        </div>
                    </template>
                </van-cell>

                <van-cell v-else-if="item.notification_type === 'INTERACTION'"
                    @click="router.push('/notice/interaction')" center>
                    <template #title>
                        <div class="interaction">
                            <van-icon name="bell" class="interaction-icon" />
                            <div class="text">
                                <p class="custom-title">互动消息</p>
                                <p class="custom-last-chat">{{ item.content }}</p>
                            </div>
                        </div>
                    </template>
                    <template #right-icon>
                        <div class="un-read" v-if="socketStore.interactiveCnt">
                            {{ socketStore.interactiveCnt }}
                        </div>
                    </template>
                </van-cell>
            </van-cell-group>
        </van-list>
        <van-empty v-else />
    </div>
    <div class="no-friends" v-else>
        <van-empty description="暂无好友" />
    </div>
</template>

<style lang="less" scoped>
.un-read {
    background-color: red;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    color: white;
    font-size: 16px;
    text-align: center;
    line-height: 20px;
    position: absolute;
    right: 18px;
    top: 28px;
}

.search-icon,
.add-icon {
    font-size: 18px;
    margin-right: 10px;
}

:deep(.van-cell) {
    height: 65px;
}

.content {
    width: 120px;
    background-color: white;
    position: absolute;
    z-index: 999;
    top: 6%;
    left: 66%;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 0 10px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    text-align: center;

    .add-friend,
    .new-friend {
        height: 50px;
        line-height: 50px;
        ;
        border-bottom: 1px solid #eeecec
    }

    &::before {
        content: '';
        position: absolute;
        top: -10px;
        right: 6px;
        right: 6px;
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid white;
    }
}

.avatar-scroll-container {
    width: 100%;
    // 这个属性，表示当内容宽度超过容器宽度时，自动显示水平滚动条
    overflow-x: auto;
    overflow-y: hidden;
    // 防止内容换行
    white-space: nowrap;
    padding: 10px 0;
    background-color: #fff;
    margin-top: 45px;

    // 隐藏WebKit浏览器（如Chrome、Safari）的滚动条
    &::-webkit-scrollbar {
        display: none;
    }

    // 隐藏IE/Edge浏览器的滚动条
    -ms-overflow-style: none;
    // 隐藏Firefox浏览器的滚动条
    scrollbar-width: none;
}

.avatar-scroll-wrapper {
    display: inline-block;
    padding: 0 15px;
}

.avatar-item {
    display: inline-block;
    text-align: center;
    margin-right: 20px;
    cursor: pointer;

    &:last-child {
        margin-right: 0;
    }

    .avatar-image {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-name {
        font-size: 12px;
        margin-top: 5px;
        color: #666;
        max-width: 50px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

:deep(.van-cell) {
    width: 100%;
}

:deep(.van-list) {
    height: 100vh;
}

.avatar-nickname {

    display: flex;
    align-items: center;

    .custom-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .text {

        p {
            margin: 0;
        }

        .custom-title,
        .custom-last-chat {
            margin-left: 10px;
            font-size: 16px;
        }

        .custom-last-chat {
            font-size: 12px;
            color: #999;
        }
    }
}

.sys,
.interaction {
    display: flex;
    align-items: center;


    .system-icon,
    .interaction-icon {
        color: #409eff;
        margin-right: 2px;
        font-size: 40px;
    }

    .interaction-icon {
        color: #67c23a;
    }

    .text {

        p {
            margin: 0;
            padding: 0;
        }

        .custom-title,
        .custom-last-chat {
            margin-left: 10px;
            font-size: 14px;
        }

        .custom-last-chat {
            font-size: 12px;
            color: #999;
        }
    }
}

.user-info {
    display: flex;
    align-items: center;
}

.read-button,
.delete-button {
    width: 80px;
    height: 100%;
}

.delete-button-full {
    width: 160px;
}
</style>