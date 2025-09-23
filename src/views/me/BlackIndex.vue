<script setup>
import { useRouter } from 'vue-router'
import { getBlackList, delBlack } from '@/api/user'
import { ref, onMounted } from 'vue'
import defaultAvatar from "@/assets/image/default.png"

const router = useRouter()

const blackList = ref([])
const page = ref(1)
const size = ref(20)
const total = ref(0)

onMounted(async () => {
    const res = await getBlackList(page.value, size.value)
    blackList.value = res.data.data.list
    total.value = res.data.data.pagination.total
})

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const onLoad = async () => {
    if (refreshing.value) {
        page.value = 1
        refreshing.value = false
    }

    const { data: { data } } = await getBlackList(page.value, size.value)

    if (page.value === 1) {
        blackList.value = data.list
    } else {
        blackList.value.push(...data.list)
    }

    loading.value = false
    ++page.value

    if (blackList.value.length >= data.pagination.total) {
        finished.value = true
    }
}
const onRefresh = () => {
    finished.value = false
    // 重新加载数据
    // 将 loading 设置为 true，表示处于加载状态
    loading.value = true
    onLoad()
}

const cancelBlack = async (targetId) => {
    await delBlack(targetId)
    const { data: { data } } = await getBlackList(1, size.value)
    total.value = data.pagination.total
    for (let i = 0; i < blackList.value.length; ++i) {
        if (blackList.value[i].targetId == targetId) {
            blackList.value.splice(i, 1)
            break
        }
    }

    showSuccessToast('删除成功')
}
</script>

<template>
    <van-nav-bar title="黑名单" left-arrow @click-left="router.back()" class="navbar" fixed />

    <div class="black" v-if="blackList.length > 0">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="pull-refresh-container">
            <div class="tip">
                <van-icon name="info" color="#84b0ed" />
                <span class="left">已拉黑</span>
                <span class="total">{{ total }}</span>
                <span>人，拉黑用户将无法与你进行互动</span>
            </div>
            <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
                <van-cell-group inset border>
                    <van-cell v-for="item in blackList" :key="item.id" class="user-info">
                        <template #title>
                            <div class="avatar-nickname">
                                <img class="custom-image" :src="item.targetUser.avatarUrl || defaultAvatar" />
                                <span class="custom-title">{{ item.targetUser.nickname || '匿名用户' }}</span>
                            </div>
                        </template>
                        <template #right-icon>
                            <van-button round type="danger" plain class="custom-button"
                                @click="cancelBlack(item.targetId)">取消拉黑</van-button>
                        </template>
                    </van-cell>
                </van-cell-group>
            </van-list>
        </van-pull-refresh>
    </div>
    <div class="empty" v-else>
        <van-empty class="custom-empty">
            <template #description>
                <strong>暂无黑名单用户</strong>
                <p class="content">你可以在好友列表或聊天中，将骚扰、违规用户加入黑名单</p>
                <strong class="go">去好友列表看看</strong>
            </template>
        </van-empty>
    </div>
</template>

<style lang="less" scoped>
.black {
    .pull-refresh-container {
        padding-top: 10px;
    }

    :deep(.van-list) {
        height: 100vh;
    }

    :deep(.van-cell-group) {
        background-color: #f6f6f6 !important;
    }

    .tip {
        background-color: white;
        line-height: 45px;
        margin-top: 50px;
        margin-left: auto;
        margin-right: auto;
        font-size: 14px;
        width: 90%;
        height: 45px;
        border-radius: 5px;
        padding-left: 10px;

        .left {
            margin-left: 8px;
        }

        .total {
            color: #84b0ed;
        }
    }

    .avatar-nickname {
        .custom-image {
            border-radius: 50%;
            width: 50px;
            height: 50px;
        }

        .custom-title {
            margin-left: 10px;
            font-size: 16px;
        }
    }

    .avatar-nickname,
    .user-info {
        display: flex;
        align-items: center;
        margin-top: 10px;
    }

    .custom-button {
        width: 80px;
        height: 30px;
        font-size: 12px;
    }
}

.empty {
    text-align: center;
    font-size: 14px;

    .content {
        color: #999;
    }

    .go {
        color: #4c82ce;
    }
}
</style>
