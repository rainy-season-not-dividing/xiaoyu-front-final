<script setup>
import { getAllTaskTag, getTaskList, takeTask } from "@/api/task"
import { ref, onMounted } from "vue"
import defaultAvatar from "@/assets/image/default.png"
import router from "@/router"

const taskTags = ref([
    {
        "id": '',
        "name": '',
        "weight": '',
        "isHot": ''
    }
])
const selectedTagId = ref(null)
const page = ref(1)
const size = ref(10)
const taskList = ref([
    {
        "id": '',
        "publisher": {
            "id": '',
            "nickname": '',
            "avatarUrl": ''
        },
        "title": '',
        "content": '',
        "reward": '',
        "status": '',
        "visibility": '',
        "expireAt": '',
        "createdAt": '',
        "files": '',
        "tags": '',
        "stats": {
            "viewCnt": '',
            "orderCnt": ''
        }
    }
])

const getTasks = async (status, keyword) => {
    const { data: { data } } = await getTaskList({ page: page.value, size: size.value, tagId: selectedTagId.value, status: status, keyword: keyword })
    taskList.value = data.list
}

onMounted(async () => {
    const { data: { data } } = await getAllTaskTag()
    taskTags.value = data
    await getTasks('', '')
})


const selectTag = async (id) => {
    selectedTagId.value = id
    await getTasks('', '')
}


const take = async (taskId) => {
    await takeTask(taskId)
    await getTasks('', '')
}

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const onLoad = async (status, keyword) => {
    if (refreshing.value) {
        taskList.value = []
        page.value = 1
        refreshing.value = false
    }

    const { data: { data } } = await getTaskList({ page: page.value, size: size.value, tagId: selectedTagId.value, status, keyword })

    if (page.value === 1) {
        taskList.value = data.list
    } else {
        taskList.value.push(...data.list)
    }

    loading.value = false

    ++page.value

    if (taskList.value.length >= data.pagination.total) {
        finished.value = true
    }
}

const onRefresh = () => {
    finished.value = false
    loading.value = true
    onLoad()
}
</script>

<template>
    <van-nav-bar title="校园任务" fixed>
        <template #right>
            <van-button round class="publish-btn" color="#84b0ed" @click="router.push('/task/publish')">
                <van-icon name="plus" color="white" class="publish-icon" />
                发布
            </van-button>
        </template>
    </van-nav-bar>

    <div class="tag-scroll-container">
        <div class="tag-scroll-wrapper">
            <div class="tag-item tag-item-all" :class="{ 'tag-item-active': selectedTagId === null }"
                @click="selectTag(null)">
                <div class="tag-name">全部</div>
            </div>
            <div v-for="item in taskTags" :key="item.id" class="tag-item"
                :class="{ 'tag-item-active': selectedTagId === item.id }" @click="selectTag(item.id)">
                <div class="tag-name">{{ item.name }}</div>
            </div>
        </div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad"
            v-if="taskList.length">
            <van-cell v-for="item in taskList" :key="item.id" @click="router.push(`/task/detail/${item.id}`)">
                <div class="top">
                    <div class="tags">
                        <van-tag type="primary" class="tag" v-for="value in item.tags" :key="value.id" color="#fef6fb"
                            text-color="#f9b5df">
                            {{ value.name }}
                        </van-tag>
                    </div>
                    <div class="status">
                        <van-tag type="primary">
                            招募中
                        </van-tag>
                    </div>
                </div>
                <div class="title">
                    {{ item.title }}
                </div>
                <div class="avatar-info">
                    <img :src="item.publisher.avatarUrl || defaultAvatar" class="avatar-image" />
                    <div class="nickname">
                        {{ item.publisher.nickname || '匿名用户' }}
                    </div>
                </div>
                <div class="footer">
                    <div class="reward">
                        <van-icon name="bill" color="red" />
                        {{ item.reward }}
                    </div>
                    <div class="views">
                        <van-icon name="eye-o" />
                        {{ item.stats.viewCnt }}
                    </div>
                </div>
                <div class="btn">
                    <van-button type="primary" class="get-btn" @click="take(item.id)">
                        抢任务
                    </van-button>
                </div>
            </van-cell>
        </van-list>
        <van-empty description="暂无任务" class="empty" v-else />
    </van-pull-refresh>
</template>

<style lang="less" scoped>
:deep(.van-tag) {
    border-radius: 5px;
}

.top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .tags {
        display: flex;

        .tag {
            margin-right: 5px;
        }
    }


}

.title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    color: black;
    text-align: left;
    padding-left: 0;
}

.avatar-info {
    display: flex;
    align-items: center;
    font-size: 16px;

    .avatar-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 8px;
    }
}

.footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    margin-top: 10px;
}

.btn {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;

    .get-btn,
    .collection-btn,
    .out {
        width: 250px;
        height: 35px;
        border-radius: 10px;
    }

    .collection-btn {
        width: 80px;
        margin-left: 8px;
    }

    .out {
        background-color: #f3f4f6;
        color: #666;
        border: none;
    }
}

.publish-btn {
    width: 70px;
    height: 30px;
    padding: 0;
    font-size: 14px;
    font-weight: bold;

    .publish-icon {
        font-size: 16px;
        font-weight: bold;
    }
}

.tag-scroll-container {
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

.tag-scroll-wrapper {
    :deep(.img) {
        width: 50px;
        height: 50px;
    }

    display: inline-block;
    padding: 0 15px;
}

.tag-item {
    display: inline-block;

    &:last-child {
        margin-right: 0;
    }

    .tag-name {
        width: 58px;
        height: 30px;
        margin-right: 10px;
        border-radius: 15px;
        text-align: center;
        line-height: 30px;
        font-size: 12px;
        margin-top: 5px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.tag-item-active {

    .tag-name {
        background-color: #9ed2fd69;
        color: rgb(79, 181, 245);
        font-weight: bold;
    }
}
</style>