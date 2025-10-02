<script setup>
import { ref, onMounted } from 'vue'
import { getFriendsList } from '@/api/friends'
import defaultAvatar from '@/assets/image/default.png'
import { sharePost } from '@/api/posts'
import { showSuccessToast } from 'vant'
import { searchUser } from '@/api/user'
import { shareTask } from '@/api/task'

const props = defineProps({
    // 动态 任务id
    id: {
        required: true
    },
    // 分享类型 POST 动态 TASK 任务
    type: {
        type: String
    }
})

const id = ref(props.id)
const type = ref(props.type)

const showShare = defineModel('showShare')
const shareCnt = defineModel('shareCnt')

const friendsList = ref([])
const getList = async () => {
    const { data: { data } } = await getFriendsList({ page: 0, size: 0, status: 'ACCEPTED' })
    friendsList.value = data.list
}

// onMounted(async () => {
//     await getList()
// })

const showFriend = ref(false)


const options = [
    { name: '好友', icon: 'chat' },
    { name: '微信', icon: 'wechat' },
    { name: '微博', icon: 'weibo' },
    { name: '复制链接', icon: 'link' },
    { name: '分享海报', icon: 'poster' },
    { name: '二维码', icon: 'qrcode' }
]

const onSelect = (option) => {
    if (option.name === '好友') {
        showShare.value = false
        showFriend.value = true
    }
}

const keyword = ref('')
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const finished = ref(false)
const onSearch = async () => {
    if (keyword.value.trim() === '') {
        await getList()
        showToast('用户名或昵称不能为空')
        return
    }

    page.value = 1
    const { data: { data } } = await searchUser(keyword.value, page.value, size.value)
    friendsList.value = data.list
}


const onLoad = async () => {
    if (keyword.value.trim() === '') {
        loading.value = false
        finished.value = true
        await getList()
        return
    }
    const { data: { data } } = await searchUser(keyword.value, page.value, size.value)

    if (page.value === 1) {
        friendsList.value = data.list
    } else {
        friendsList.value.push(...data.list)
    }

    loading.value = false

    ++page.value

    if (friendsList.value.length >= data.pagination.total) {
        finished.value = true
    }
}

const shareUserIds = ref([])

const selected = (item) => {
    if (shareUserIds.value.includes(item.friendInfo.id)) {
        shareUserIds.value.splice(shareUserIds.value.indexOf(item.friendInfo.id), 1)
    } else {
        shareUserIds.value.push(item.friendInfo.id)
    }
}

const onShare = async () => {
    if (shareUserIds.value.length === 0) {
        showToast('请选择分享的好友')
        return
    }
    if (type.value === 'POST') {
        const { data: { data } } = await sharePost(id.value, shareUserIds.value)
        shareCnt.value = data.shareCnt
    } else {
        await shareTask(id.value, shareUserIds.value)
    }
    showFriend.value = false
    showSuccessToast('分享成功')
    shareUserIds.value = []
}
</script>

<template>
    <van-share-sheet v-model:show="showShare" title="立即分享给好友" :options="options" @select="onSelect" />

    <van-action-sheet v-model:show="showFriend" title="分享好友" class="share-sheet" :closeable="false">

        <van-search v-model="keyword" placeholder="请输入用户账号或昵称" @keyup="onSearch" />

        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
            <van-cell-group inset>
                <van-cell v-for="item in friendsList" :key="item.id" @click="selected(item)">
                    <div class="user-info" :class="{ 'selected': shareUserIds.includes(item.friendInfo.id) }">
                        <div class="avatar">
                            <img class="custom-image" :src="item.friendInfo.avatarUrl || defaultAvatar" />
                        </div>
                        <div class="nickname">
                            {{ item.friendInfo.nickname }}
                        </div>
                    </div>
                </van-cell>
            </van-cell-group>
        </van-list>

        <div class="btn">
            <van-button round type="primary" @click="onShare" class="share-btn">分享</van-button>
        </div>
    </van-action-sheet>

</template>

<style lang="less" scoped>
.user-info {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 10px;

    .custom-image {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 10px;
    }

    .nickname {
        font-size: 16px;
    }
}

.selected {
    background-color: #f3f4f6;
}

:deep(.van-loading) {
    margin-bottom: 70px;
}

:deep(.van-list__finished-text) {
    margin-bottom: 70px;
}

.btn {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);

    .share-btn {
        width: 300px;
        font-size: 16px;
    }
}
</style>