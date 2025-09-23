<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { searchUser } from '@/api/user'
import defaultAvatar from '@/assets/image/default.png'

const router = useRouter()

const keyword = ref('')

const userList = ref([])
const page = ref(1)
const size = ref(10)
const onSearch = async () => {
    if (keyword.value.trim() === '') {
        showToast('用户名或昵称不能为空')
        return
    }

    page.value = 1

    const { data: { data } } = await searchUser(keyword.value, page.value, size.value)
    userList.value = data.list
}

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const onLoad = async () => {
    if (keyword.value.trim() === '') {
        loading.value = false
        finished.value = true
        return
    }

    if (refreshing.value) {
        userList.value = []
        page.value = 1
        refreshing.value = false
    }

    const { data: { data } } = await searchUser(keyword.value, page.value, size.value)

    if (page.value === 1) {
        userList.value = data.list
    } else {
        userList.value.push(...data.list)
    }

    loading.value = false

    ++page.value

    if (userList.value.length >= data.pagination.total) {
        finished.value = true
    }
}

const onRefresh = () => {
    if (keyword.value.trim() === '') {
        return
    }
    // 清空列表数据
    finished.value = false

    // 重新加载数据
    // 将 loading 设置为 true，表示处于加载状态
    loading.value = true
    onLoad()
}

</script>

<template>
    <van-nav-bar title="添加朋友" left-arrow @click-left="router.back()" fixed />

    <van-search v-model="keyword" placeholder="请输入用户账号或昵称" @input="onSearch" class="search" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
            <van-cell-group>
                <van-cell v-for="item in userList" :key="item.id" @click="router.push(`/user/${item.id}`)">
                    <template #title>
                        <div class="user-info">
                            <img class="avatar" :src="item.avatarUrl || defaultAvatar" />

                            <div class="info">
                                <div class="nickname" v-if="keyword && item.nickname.startsWith(keyword)">
                                    <span class="selected">{{ keyword }}</span>
                                    <span>{{ item.nickname.substring(keyword.length) }}</span>
                                </div>
                                <div class="nickname" v-else>
                                    {{ item.nickname }}
                                </div>

                                <span>(</span>
                                <div class="account" v-if="keyword && item.account.startsWith(keyword)">
                                    <span class="selected">{{ keyword }}</span>
                                    <span>{{ item.account.substring(keyword.length) }}</span>
                                </div>
                                <div class="account" v-else>
                                    {{ item.account }}
                                </div>
                                <span>)</span>
                            </div>
                        </div>
                    </template>
                </van-cell>
            </van-cell-group>
        </van-list>
    </van-pull-refresh>
</template>

<style lang="less" scoped>
:deep(.van-list) {
    height: 100vh;
}

.search {
    margin-top: 45px;
}

.user-info {
    display: flex;
    align-items: center;

    img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
    }

    .info {
        display: flex;
        font-size: 20px;

        .nickname {
            margin-right: 5px;
        }
    }
}

.selected {
    color: #57a1f6;
    margin: 0;
}
</style>