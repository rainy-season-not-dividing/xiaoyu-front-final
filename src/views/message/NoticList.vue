<script setup>
import { ref, onMounted } from 'vue'
import { getNoticeList } from '@/api/notice'
import { useRoute, useRouter } from 'vue-router'
import defaultAvatar from '@/assets/image/default.png'
import { timeAgo } from '@/utils/timeFormat'

const route = useRoute()
const router = useRouter()
const type = ref(route.params.type)

const page = ref(1)
const size = ref(10)
const noticeList = ref([
    {
        "id": 7001,
        "type": "LIKE",
        "title": "您的动态收到了新的赞",
        "content": "用户昵称 赞了您的动态 “今天天气真好”",
        "ref_id": 2001,
        "ref_type": "POST",
        "status": "UNREAD",
        "createdAt": "2023-01-01T00:00:00Z",
        "fromUser": { // 如果是用户互动类通知，可包含来源用户信息
            "id": 1002,
            "nickname": "用户昵称",
            "avatarUrl": ""
        },
        "count": 1
    }
])

onMounted(async () => {
    const { data: { data } } = await getNoticeList(type.value, page.value, size.value)
    noticeList.value = data.list
})

const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);

const onLoad = async () => {
    if (refreshing.value) {
        noticeList.value = []
        refreshing.value = false
        page.value = 1
    }

    const { data: { data } } = await getNoticeList(type.value, page.value, size.value)
    if (page.value === 1) {
        noticeList.value = data.list
    } else {
        noticeList.value.push(...data.list)
    }

    loading.value = false
    ++page.value

    if (list.value.length >= data.pagination.total) {
        finished.value = true
    }
}

const onRefresh = () => {
    // 清空列表数据
    finished.value = false
    // 重新加载数据
    // 将 loading 设置为 true，表示处于加载状态
    loading.value = true
    onLoad()
}

const del = (targetId) => {
    for (const index in noticeList.value) {
        if (noticeList.value[index].id === targetId) {
            noticeList.value.splice(index, 1)
        }
    }
}

// 根据id在数组中找到值
const findValueById = (targetId) => {
    return noticeList.value.find(item => item.id === targetId)
}
const read = async (notificationId) => {
    // await readNotice(notificationId)
    const value = findValueById(notificationId)
    if (value) {
        value.status = 'READ'
    }
}
</script>

<template>
    <van-nav-bar :title="type === 'SYSTEM' ? '系统通知' : '互动通知'" left-arrow @click-left="router.back()" fixed />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
            <van-swipe-cell v-for="item in noticeList" :key="item.id">
                <van-cell center>
                    <template #title>
                        <div class="container">
                            <div class="avatar" v-if="item.fromUser">
                                <img :src="item.fromUser.avatarUrl || defaultAvatar" alt="" class="avatar-image" />
                            </div>
                            <div class="nickname-content-time">
                                <div class="nickname-time">
                                    <div class="nickname" v-if="item.fromUser">
                                        {{ item.fromUser.nickname }}
                                    </div>
                                    <div class="time">
                                        {{ timeAgo(item.createdAt) }}
                                    </div>
                                </div>
                                <div class="content">
                                    {{ item.content }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #right-icon>
                        <div class="un-read" v-if="item.status === 'UNREAD'">
                        </div>
                    </template>
                </van-cell>
                <template #right>
                    <van-button square text="已读" color="#c4c0c0" class="read-button" @click="read(item.id)"
                        v-if="item.status === 'UNREAD'" />
                    <van-button square text="删除" type="danger" class="delete-button" @click="del(item.id)"
                        :class="{ 'delete-button-full': item.status === 'READ' }" />
                </template>
            </van-swipe-cell>
        </van-list>
    </van-pull-refresh>
</template>

<style lang="less" scoped>
:deep(.van-list) {
    height: 100vh;
    margin-top: 50px;
}

.avatar-image {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 10px;
}

.container {
    display: flex;
    padding: 5px;

    .nickname-time {
        display: flex;
        justify-content: space-between;

        .nickname {
            font-size: 16px;
        }

        .time {
            font-size: 12px;
            color: #999;
        }
    }

    .content {
        margin-top: 5px;
        font-size: 14px;
        color: #666;
    }
}

.un-read {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: red;
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
