<script setup>
import { ref, onMounted } from 'vue'
import { getHotTopics, getHotPosts } from '@/api/search'
import { useRouter } from 'vue-router'
import { getAllTopic } from '@/api/posts'

const router = useRouter()

const key = ref('')
const hotTopicList = ref([{
    "id": '',
    "name": '',
    "description": '',
    "postCount": ''
}])

const hotPostList = ref([{
    "id": '',
    "user": {
        "id": '',
        "username": '',
        "nickname": '',
        "avatarUrl": '',
        "gender": '',
        "campusId": '',
        "isRealName": '',
        "createdAt": '',
    },
    "title": '',
    "content": '',
    "campusId": '',
    "visibility": '',
    "poiName": '',
    "isTop": '',
    "status": '',
    "files": '',
    "topics": '',
    "stats": {
        "viewCnt": '',
        "likeCnt": '',
        "favCnt": '',
        "commentCnt": '',
        "shareCnt": '',
    },
    "userActions": {
        "isLiked": '',
        "isFavorited": '',
    },
    "createdAt": '',
    "updatedAt": '',
}])

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

onMounted(async () => {
    const { data: { data } } = await getHotTopics()
    hotTopicList.value = data
    console.log(data)
    console.log(hotTopicList.value)
})

onMounted(async () => {
    const { data: { data } } = await getHotPosts()
    hotPostList.value = data
    console.log(data)
    console.log(hotPostList.value)
})

const topicList = ref([])

const showAllTopics = ref(false)

onMounted(async () => {
    const { data: { data } } = await getAllTopic()
    topicList.value = data
})

const onLoad = async () => {
    if (refreshing.value) {
        hotTopicList.value = []
        hotPostList.value = []
        refreshing.value = false
    }

    const { data: { data } } = await getHotTopics()
    hotTopicList.value = data

    const { data: { data: d1 } } = await getHotPosts()
    hotPostList.value = d1

    const { data: { data: d2 } } = await getAllTopic()
    topicList.value = d2

    loading.value = false
    finished.value = true
}

const onRefresh = () => {
    // 清空列表数据
    hotTopicList.value = []
    hotPostList.value = []
    finished.value = false
    // 重新加载数据
    // 将 loading 设置为 true，表示处于加载状态
    loading.value = true
    onLoad()
}

const onSearch = () => {
    if (key.value.trim() === '') {
        showToast('搜索内容不能为空')
        return
    }
    router.push({
        path: '/search/result',
        query: {
            key: key.value
        }
    })
}
</script>

<template>
    <van-nav-bar title="帖子搜索" left-arrow @click-left="router.back()" fixed />
    <div class="container">
        <van-search v-model="key" placeholder="请输入搜索关键词" show-action class="search-bar">
            <template #action>
                <van-button class="search-btn" @click="onSearch" type="primary" color="#60a5fa">搜索</van-button>
            </template>
        </van-search>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <div class="hot-posts-topics">
                <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
                    <div class="hot-posts">
                        <strong><van-icon name="fire" color="#ee0a24" />文章围观TOP10</strong>
                        <div v-if="hotPostList[0].id">
                            <van-cell v-for="(item, index) in hotPostList" :key="item.id"
                                @click="router.push(`/posts/detail/${item.id}`)" class="hot-post-item">
                                <template #title>
                                    <div class="content">
                                        <div class="rank">
                                            {{ index + 1 }}
                                        </div>
                                        <div class="title">
                                            {{ item.title }}
                                        </div>
                                    </div>
                                </template>
                                <template #value>
                                    {{ `${item.stats.viewCnt}人围观` }}
                                </template>
                            </van-cell>
                        </div>
                        <van-empty description="暂无" class="empty" v-else />
                    </div>

                    <div class="hot-topics">
                        <strong><van-icon name="fire" color="#ee0a24" />话题讨论TOP10</strong>
                        <div v-if="hotTopicList[0].id">
                            <van-cell v-for="(item, index) in hotTopicList" :key="item.id" class="hot-topic-item"
                                @click="router.push({
                                    path: '/search/result',
                                    query: {
                                        topicId: item.id,
                                        topicName: item.name
                                    }
                                })">
                                <template #title>
                                    <div class="content">
                                        <div class="rank">
                                            {{ index + 1 }}
                                        </div>
                                        <div class="title">
                                            {{ item.name }}
                                        </div>
                                    </div>
                                </template>
                                <template #value>
                                    {{ `${item.postCount}人讨论` }}
                                </template>
                            </van-cell>
                        </div>
                        <van-empty description="暂无" class="empty" v-else />
                    </div>

                    <div class="all-topics">
                        <strong><van-icon name="column" color="#60a5fa" />全部话题</strong>
                        <van-icon name="arrow-up" color="#b3b1b1" v-if="showAllTopics" @click="showAllTopics = false" />
                        <van-icon name="arrow-down" color="#b3b1b1" v-else @click="showAllTopics = true" />
                    </div>

                    <div class="topics" v-if="showAllTopics">
                        <div class="topic" v-for="item in topicList" :key="item.id" @click="router.push({
                            path: '/search/result',
                            query: {
                                topicId: item.id,
                                topicName: item.name
                            }
                        })">
                            {{ item.name }}
                        </div>
                    </div>
                </van-list>
            </div>
        </van-pull-refresh>
    </div>
</template>

<style lang="less" scoped>
.topics {
    margin-top: 15px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 10px;

    .topic {
        padding: 10px;
        background-color: white;
        border-radius: 8px;
        font-size: 14px;
        text-align: center;
    }
}

.all-topics {
    display: flex;
    justify-content: space-between;
    align-items: center;

    :deep(.van-icon) {
        font-size: 18px;
        margin-right: 8px;
    }
}

.empty {
    padding: 0;
}

.container {
    width: 96%;
    /* 左边距自动 右边距自动 居中 */
    margin-left: auto;
    margin-right: auto;
}

.van-pull-refresh {
    strong {
        display: block;
        font-size: 18px;
        margin-bottom: 5px;
    }

    .hot-posts-topics {
        margin-top: 20px;

        .hot-posts,
        .hot-topics {
            margin-bottom: 10px;
        }

        .hot-post-item,
        .hot-topic-item {
            .content {
                display: flex;
                align-items: center;
                color: #4f5b6a;
                font-size: 14px;
                font-weight: 600;

                .rank {
                    width: 20px;
                    height: 20px;
                    background-color: #f3f4f6;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-right: 10px;
                }
            }

            &:nth-of-type(1) .rank {
                background-color: #ffc107;
                font-weight: bold;
            }

            &:nth-of-type(2) .rank {
                background-color: #e0e0e0;
                font-weight: bold;
            }

            &:nth-of-type(3) .rank {
                background-color: #b87333;
                font-weight: bold;
            }

            &:active {
                background-color: #dbdbdc;
            }
        }
    }
}

:deep(.van-cell) {
    background-color: #fafafc;
}


.search-bar {
    margin-top: 60px;
    margin-bottom: 10px;
    padding: 5px;
    border-radius: 10px;

    :deep(.van-search__content) {
        background-color: white;
    }

    :deep(.van-field__body) {
        border-radius: 20px;
    }

    :deep(.van-search__action) {
        display: flex;
        align-items: center;
    }

    .search-btn {
        width: 60px;
        height: 30px;
        border-radius: 10px;
    }
}
</style>
