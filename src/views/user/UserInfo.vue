<script setup>
import { getUserDetail } from "@/api/user"
import { getUserPostList } from "@/api/posts"
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import defaultAvatar from '@/assets/image/default.png'
import { timeAgo } from "@/utils/timeFormat"

const route = useRoute()
const router = useRouter()

const userInfo = ref({})
const title = ref('')

onMounted(async () => {
    const { data: { data } } = await getUserDetail(route.params.id)
    userInfo.value = data
    title.value = `${userInfo.value.nickname}的主页`
})

const postList = ref([])
const page = ref(1)
const size = ref(10)

onMounted(async () => {
    const { data: { data } } = await getUserPostList(route.params.id, page.value, size.value)
    postList.value = data.list
})

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const onLoad = async () => {
    if (refreshing.value) {
        postList.value = [];
        refreshing.value = false;
        page.value = 1
    }

    const { data: { data } } = await getUserDetail(route.params.id)
    userInfo.value = data
    title.value = `${userInfo.value.nickname}的主页`

    const { data: { data: d } } = await getUserPostList(route.params.id, page.value, size.value)

    if (page.value === 1) {
        postList.value = d.list
    } else {
        postList.value.push(...d.list)
    }

    loading.value = false
    ++page.value

    if (postList.value.length >= d.pagination.total) {
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

const handleClick = () => {
    console.log('handleClick')
    router.push({
        path: '/chat',
        query: {
            userId: userInfo.value.id,
            nickname: userInfo.value.nickname,
            avatarUrl: encodeURIComponent(userInfo.value.avatarUrl)
        }
    })
}
</script>

<template>
    <van-nav-bar :title="title" left-arrow fixed @click-left="router.back()" />

    <div class="info">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
                <div class="container">
                    <div class="header">
                        <div class="bg">

                        </div>

                        <div class="info">
                            <div class="avatar">
                                <img :src="userInfo.avatarUrl || defaultAvatar" class="avatar-image" />
                            </div>
                            <div class="nickname-gender-campus">
                                <div class="nickname-gender">
                                    <span>{{ userInfo.nickname }}</span>
                                    <div class="gender">
                                        <van-icon class-prefix="my-icon" name="nan" v-if="userInfo.gender === 1"
                                            color="#1296db" />
                                        <van-icon class-prefix="my-icon" name="nvxing" color="#d4237a"
                                            v-else-if="userInfo.gender === 2" />
                                    </div>
                                </div>
                                <div class="campus">
                                    {{ userInfo.campusName }}
                                </div>
                            </div>

                            <!-- <div class="cnt">
                                    <div class="post_cnt">
                                        <p class="cnt">{{ userInfo.stats.postCount }}</p>
                                        <p class="text">发布内容</p>
                                    </div>
                                    <div class="follower_cnt">
                                        <p class="cnt">{{ userInfo.stats.followerCount }}</p>
                                        <p class="text">粉丝</p>
                                    </div>
                                    <div class="follow_cnt">
                                        <p class="cnt">{{ userInfo.stats.followingCount }}</p>
                                        <p class="text">关注</p>
                                    </div>
                                </div> -->
                        </div>

                        <div class="btn">
                            <div class="follow">
                                <van-button class="follow-btn" type="primary" round color="#60a5fa">加好友</van-button>
                            </div>

                            <div class="chat" @click.stop="handleClick">
                                <van-button class="chat-btn" type="primary" round color="white">
                                    <van-icon name="guide-o" />
                                    <span class="text">私信</span>
                                </van-button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="posts">
                    <div class="cell-grid">
                        <div v-for="item in postList" :key="item.id" class="custom-cell"
                            :class="{ 'no-content': !item.content && !item.files.length }"
                            @click="router.push(`/posts/detail/${item.id}`)">
                            <div class="file" v-if="item.files.length > 0">
                                <img :src="item.files[0].fileUrl" />
                            </div>
                            <div class="content">
                                <p class="text" v-if="item.content.length <= 50">
                                    {{ item.content }}
                                </p>
                                <p class="text" v-else>
                                    {{ item.content.substring(0, 50) }}...
                                </p>
                            </div>
                            <div class="time">
                                <p class="time-text">
                                    {{ timeAgo(item.createdAt) }}
                                </p>
                            </div>
                            <div class="like" v-if="item.stats.likeCnt">
                                <van-icon name="good-job-o" color="white" />
                                <span class="like-text">
                                    {{ item.stats.likeCnt }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </van-list>
        </van-pull-refresh>
    </div>
</template>

<style lang="less" scoped>
:deep(.van-cell__value) {
    text-align: left; // 将内容左对齐
}

.header {
    position: relative;

    .bg {
        height: 180px;
        margin-top: 45px;
        background: linear-gradient(135deg,
                #fce7f3 0%,
                #e0f2fe 100%);
        backdrop-filter: blur(10px);
        /* 模糊效果增强层次感 */
    }


    .info {
        display: flex;
        position: absolute;
        top: 148px;
        left: 15px;

        .avatar {
            margin-right: 10px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid white;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;

            .avatar-image {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
            }
        }

        .nickname-gender-campus {
            .nickname-gender {
                display: flex;
                align-items: center;
                font-size: 18px;
                font-weight: bold;
                margin-top: 3px;
                margin-right: 5px;

                .gender {
                    margin-left: 5px;
                }
            }

            .campus {

                font-size: 12px;
            }

            .cnt {
                margin-top: 5px;
                display: flex;
                align-items: center;
                margin-right: 10px;
                font-size: 14px;

                .post_cnt,
                .follower_cnt,
                .follow_cnt {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-right: 10px;

                    p {
                        margin: 0;
                    }

                    .text {
                        font-size: 10px;
                        color: #9ea8b8;
                    }

                }
            }
        }
    }

    .btn {
        display: flex;
        align-items: center;
        position: absolute;
        right: 10px;
        top: 150px;

        .follow-btn,
        .chat-btn {
            width: 68px;
            height: 20px;
            font-size: 12px;
        }

        .chat-btn {
            margin-left: 5px;

            :deep(.van-button__text) {
                color: black;
            }
        }
    }
}


.posts {
    margin-top: 60px;

    .cell-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 10px;
        padding: 0 10px;

        .custom-cell {
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 10px;
            position: relative;

            &.no-content {
                background: transparent !important;
                box-shadow: none !important;
                padding: 0 !important;
            }

            .file {
                margin-bottom: 10px;

                img {
                    width: 100%;
                    height: 120px;
                    border-radius: 8px;
                    object-fit: cover;
                }
            }

            .content {
                margin-bottom: 10px;

                .text {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #333;
                }
            }

            .time {
                margin-bottom: 10px;

                .time-text {
                    margin: 0;
                    font-size: 12px;
                    color: #999;
                }
            }

            .like {
                display: flex;
                align-items: center;
                position: absolute;
                right: 15px;
                top: 15px;
                width: 30px;
                height: 15px;
                border-radius: 5px;
                background-color: rgba(170, 170, 172, .8);
                padding: 3px;

                .van-icon {
                    margin-right: 1px;
                    font-size: 10px;
                }

                .like-text {
                    font-size: 10px;
                    color: white;
                }
            }
        }
    }
}
</style>