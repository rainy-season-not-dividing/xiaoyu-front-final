<script setup>
import { getPostDetail, getCommentList, likePost, cancelLikePost, collectPost, cancelCollectPost, sharePost, likeComment, cancelLikeComment, publishComment, deleteComment } from "@/api/posts";
import { getFriendsList } from "@/api/friends"
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import defaultAvatar from "@/assets/image/default.png"
import { timeAgo } from "@/utils/timeFormat"
import { useUserStore } from '@/stores'
import { handleInputFocus, handleInputBlur, scrollToInput } from '@/utils/move'

const userStore = useUserStore()

const route = useRoute()
const router = useRouter()

const postId = route.params.id

const post = ref({
    "id": '',
    "user": {
        "id": '',
        "nickname": '',
        "avatarUrl": '',
    },
    "content": '',
    "visibility": '',
    "poiName": '',
    "isTop": '',
    "status": '',
    "files": [],
    "topics": [],
    "tags": [],
    "stats": {
        "viewCnt": '',
        "likeCnt": '',
        "commentCnt": '',
        "shareCnt": ''
    },
    "userActions": {
        "isLiked": '',
        "isFavorited": ''
    },
    "createdAt": '',
    "updatedAt": ''
})

const commentList = ref([])

const commentPage = ref(1)
const commentSize = ref(10)

const commentLoading = ref(false)
const commentFinished = ref(false)
const refreshing = ref(false)

const friendsList = ref([])

onMounted(async () => {
    const { data: { data } } = await getPostDetail(postId)
    post.value = data
    console.log(post.value)

    const { data: { data: d1 } } = await getCommentList(route.params.id, { page: commentPage.value, size: commentSize.value })
    commentList.value = d1.list
    console.log(commentList.value)

    const { data: { data: d2 } } = await getFriendsList({ page: 0, size: 0, status: 'ACCEPTED' })
    friendsList.value = d2.list
    console.log(friendsList.value)
})

const onLoad = async () => {
    if (refreshing.value) {
        commentList.value = []
        refreshing.value = false
        commentPage.value = 1
    }

    const { data: { data } } = await getCommentList(route.params.id, { page: commentPage.value, size: commentSize.value })

    if (commentPage.value === 1) {
        commentList.value = data.list
    } else {
        commentList.value.push(...data.list)
    }

    commentLoading.value = false

    if (commentList.value.length >= data.pagination.total) {
        commentFinished.value = true
    }
}

const onRefresh = () => {
    // 清空列表数据
    commentList.value = []
    commentFinished.value = false

    // 重新加载数据
    // 将 loading 设置为 true，表示处于加载状态
    commentLoading.value = true
    onLoad()
}

const like = async () => {
    if (post.value.userActions.isLiked) {
        const { data: { data } } = await cancelLikePost(postId)
        post.value.userActions.isLiked = false
        post.value.stats.likeCnt = data.likeCnt
    } else {
        const { data: { data } } = await likePost(postId)
        post.value.userActions.isLiked = true
        post.value.stats.likeCnt = data.likeCnt
    }
}

const collect = async () => {
    if (post.value.userActions.isFavorited) {
        await cancelCollectPost(postId)
        post.value.userActions.isFavorited = false
    } else {
        await collectPost(postId)
        post.value.userActions.isFavorited = true
    }
}

const share = async () => {
    const { data: data } = await sharePost(postId)
    post.value.stats.shareCnt = data.shareCnt
}

// 根据id查找comment
const findCommentById = (commentId) => {
    return commentList.value.find(comment => comment.id === commentId)
}

// 找二级
const findSecondCommentById = (parentId, commentId) => {
    const comment = commentList.value.find(comment => comment.id === parentId)
    return comment.replies.find(reply => reply.id === commentId)
}
const likeComments = async (commentId, isLiked, type, parentId) => {
    let comment
    if (type === 'first') {
        comment = findCommentById(commentId)
    } else {
        comment = findSecondCommentById(parentId, commentId)
    }
    if (isLiked) {
        const { data: { data } } = await cancelLikeComment(commentId)
        comment.isLiked = false
        comment.likeCnt = data.like_cnt
    } else {
        const { data: { data } } = await likeComment(commentId)
        comment.isLiked = true
        comment.likeCnt = data.like_cnt
    }

}

const atFlag = ref(false)

const commentContent = ref('')
const atUsersFlag = ref(new Map())
const atUsers = ref([])

const commentInput = ref(null)

// 处理 @ 按钮点击
const handleAtClick = () => {
    atFlag.value = !atFlag.value

    // 如果是打开列表，则让输入框获得焦点
    if (atFlag.value) {
        if (commentInput.value) {
            commentInput.value.focus()

            // 将光标移动到文本末尾
            const range = document.createRange()
            const selection = window.getSelection()
            range.selectNodeContents(commentInput.value)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }
}

const atOrNotAt = (atId) => {
    const currentValue = atUsersFlag.value.get(atId) || false
    atUsersFlag.value.set(atId, !currentValue)
    atUsers.value = [...atUsersFlag.value.entries()]
        .filter(([key, value]) => value)
        .map(([key]) => key)
}

const currentReplyTo = ref(null)
const setReplyTo = (parentId) => {
    currentReplyTo.value = parentId
}
// 处理评论的评论按钮点击
const secondComment = (parentId) => {
    // 设置parentId 通过这个来标识是评论的评论还是评论帖子
    setReplyTo(parentId)

    // 点击评论按钮时，让输入框获得焦点
    if (commentInput.value) {
        commentInput.value.focus()

        // 将输入框往上顶
        scrollToInput(commentInput)
    }
}

// 同时处理评论帖子和用户
const publish = async () => {
    // 检查是否有回复目标
    const isReply = currentReplyTo.value !== null

    if (isReply) {
        // 二级评论
        const { data: { data } } = await publishComment(postId, {
            content: commentContent.value,
            parentId: currentReplyTo.value,
            atUsers: atUsers.value
        })

        data.isLiked = false
        data.likeCnt = 0

        findCommentById(currentReplyTo.value).replies.push(data)
    } else {
        // 一级评论
        const { data: { data } } = await publishComment(postId, {
            content: commentContent.value,
            parentId: 0,
            atUsers: atUsers.value
        })

        commentList.value.unshift(data)
    }
    commentContent.value = ''
    currentReplyTo.value = null
    atUsers.value = []
    atFlag.value = false
}

const deleteUserComment = async (commentId, type, parentId) => {
    if (type === 'first') {
        await deleteComment(commentId)
        commentList.value.splice(commentList.value.findIndex(comment => comment.id === commentId), 1)
    } else {
        await deleteComment(commentId)
        const parentComment = findCommentById(parentId)
        parentComment.replies.splice(parentComment.replies.findIndex(reply => reply.id === commentId), 1)
    }
}
</script>

<template>
    <van-nav-bar title="帖子详情" left-arrow @click-left="router.back()" fixed />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="post">
            <div class="user-info">
                <div class="avatar">
                    <img :src="post?.user?.avatarUrl || defaultAvatar" class="avatar-image" />
                </div>
                <div class="nickname-time">
                    <div class="nickname">{{ post?.user?.nickname }}</div>
                    <div class="time">
                        <span class="time-text">{{ timeAgo(post.createdAt) }}</span>
                    </div>
                </div>

                <div class="view-cnt" v-if="post?.stats?.viewCnt">
                    <van-icon name="eye-o" class="view-icon" />
                    <span class="view-cnt-text">{{ post?.stats?.viewCnt }}</span>
                </div>
            </div>

            <div class="container">
                <div class="content">
                    {{ post.content }}
                </div>

                <div class="topics">
                    <div class="topic-scroll-container">
                        <div class="topic-scroll-wrapper">
                            <div v-for="item in post?.topics" :key="item.id" class="topic-item">
                                <div class="topic-name">{{ item.name }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="files">
                    <div class="file-scroll-container">
                        <div class="file-scroll-wrapper">
                            <div v-for="item in post?.files" :key="item.id" class="file-item">
                                <img class="file-image" :src="item.fileUrl" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="location" v-if="post.poiName">
                    <van-icon name="location-o" />
                    <div class="location-text">{{ post.poiName }}</div>
                </div>

                <div class="function">
                    <div class="like-comment">
                        <div class="likes" @click="like()">
                            <div class="text">
                                <van-icon name="good-job" v-if="post?.userActions?.isLiked" color="#fb523f" />
                                <van-icon name="good-job-o" v-else />
                                <span class="likes-text" v-if="post?.stats?.likeCnt">{{ post.stats.likeCnt }}</span>
                            </div>
                        </div>

                        <div class="comment">
                            <div class="text">
                                <van-icon name="chat-o" />
                                <span class="comment-text" v-if="post?.stats?.commentCnt">{{ post.stats.commentCnt
                                }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="collection-share">
                        <div class="collection" @click="collect()">
                            <van-icon name="bookmark" v-if="post?.userActions?.isFavorited" color="#fbc31d" />
                            <van-icon name="bookmark-o" v-else />
                        </div>

                        <div class="share" @click="share()">
                            <van-icon name="share-o" />
                            <span class="share-text" v-if="post?.stats?.shareCnt">{{ post.stats.shareCnt }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="comments">
            <div class="comment-header" v-if="post?.stats?.commentCnt">
                <span class="comment-title">评论{{ post?.stats?.commentCnt }}条</span>
            </div>
            <div class="comment-header" v-else>
                <span class="comment-title">暂无评论，来抢首评</span>
            </div>

            <div class="inp">
                <div class="avatar-scroll-container" :class="{ 'show-at': atFlag }">
                    <div class="avatar-scroll-wrapper">
                        <div v-for="item in friendsList" :key="item.id" class="avatar-item"
                            @click="atOrNotAt(item.friendId)">
                            <div class="select-style" :class="{ 'show-select': atUsersFlag.get(item.friendId) }">
                                <van-icon name="success" color="#fb288e" class="select-icon" />
                            </div>
                            <img :src="item.friendInfo.avatarUrl || defaultAvatar" class="avatar-image" />
                            <div class="avatar-name">{{ item?.friendInfo?.nickname }}</div>
                        </div>
                    </div>
                </div>

                <div class="publish">
                    <div class="avatar">
                        <img :src="userStore.userInfo.avatar || defaultAvatar" class="avatar-image" />
                    </div>
                    <div class="publish-container" ref="commentInput" v-keyboard>
                        <div class="publish-input">
                            <textarea v-model="commentContent" placeholder="善于结善缘，恶言伤人心"
                                @focus="handleInputFocus(commentInput)" @blur="handleInputBlur"></textarea>
                        </div>
                        <div class="publish-at">
                            <div @click="handleAtClick">@</div>
                        </div>

                        <div class="publish-button">
                            <van-button @click="publish">发布</van-button>
                        </div>
                    </div>
                </div>
            </div>


            <van-list v-model:loading="commentLoading" :finished="commentFinished" finished-text="没有更多了" @load="onLoad">
                <div class="comment-list" v-if="commentList">
                    <div v-for="comment in commentList" :key="comment.id" class="comment-item">
                        <div class="comment-user">
                            <img round :src="comment?.user?.avatarUrl || defaultAvatar" class="comment-avatar" />
                            <span class="comment-nickname">{{ comment?.user?.nickname }}</span>
                        </div>

                        <div class="comment-content">
                            {{ comment.content }}
                            <div v-if="comment.atUsers.length">
                                <span class="at">@</span>
                                <span v-for="user in comment.atUsers" :key="user.id" class="comment-at-user"
                                    @click="router.push(`/user/${user.id}`)">
                                    {{ user.nickname }}&nbsp;
                                </span>
                            </div>
                        </div>

                        <div class="comment-info">
                            <div class="comment-time">
                                {{ timeAgo(comment.createdAt) }}
                            </div>

                            <div class="actions">
                                <div class="comment-user" @click="secondComment(comment.id)">
                                    评论
                                </div>
                                <div class="delete-comment" v-if="comment?.user.id === userStore.userInfo.id">
                                    <van-icon name="delete-o" @click="deleteUserComment(comment.id, 'first', null)" />
                                </div>

                                <div class="comment-like"
                                    @click="likeComments(comment.id, comment.isLiked, 'first', null)">
                                    <van-icon name="good-job" v-if="comment.isLiked" color="#fb523f" />
                                    <van-icon name="good-job-o" v-else />
                                    <span class="text" v-if="comment.likeCnt">
                                        {{ comment.likeCnt }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="second-comment" v-if="comment.replies.length">
                            <div class="second-comment-line" v-for="reply in comment.replies" :key="reply.id">
                                <div class="comment-user">
                                    <img round :src="reply.user.avatarUrl || defaultAvatar" class="comment-avatar" />
                                    <span class="comment-nickname">{{ reply.user.nickname
                                    }}</span>
                                </div>

                                <div class="comment-content">
                                    {{ reply.content }}
                                    <div v-if="reply.atUsers.length">
                                        @
                                        <span v-for="user in reply.atUsers" :key="user.id" class="comment-at-user"
                                            @click="router.push(`/user/${user.id}`)">
                                            {{ user.nickname }}&nbsp;
                                        </span>
                                    </div>
                                </div>

                                <div class="second-comment-info">
                                    <div class="comment-time">
                                        {{ timeAgo(reply.createdAt) }}
                                    </div>

                                    <div class="actions">
                                        <div class="delete-comment" v-if="reply.user.id === userStore.userInfo.id">
                                            <van-icon name="delete-o"
                                                @click="deleteUserComment(reply.id, 'second', comment.id)"></van-icon>
                                        </div>

                                        <div class="comment-like"
                                            @click="likeComments(reply.id, reply.isLiked, 'second', comment.id)">
                                            <van-icon name="good-job" v-if="reply.isLiked" color="#fb523f" />
                                            <van-icon name="good-job-o" v-else />
                                            <span class="text" v-if="reply.likeCnt">
                                                {{ reply.likeCnt }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="no-comments">
                    暂无评论
                </div>
            </van-list>
        </div>
    </van-pull-refresh>
</template>

<style lang="less" scoped>
.at,
.comment-at-user {
    color: #409EFF;
}

:deep(.van-list) {
    height: 100vh;
}

.post {
    margin-top: 60px;
    background-color: white;
    padding: 10px;
}

.user-info {
    background-color: white;
    display: flex;

    .avatar-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .nickname-time {
        margin-left: 10px;

        .nickname {
            font-size: 16px;
        }

        .time {
            font-size: 12px;
            color: #a1a8b3;
        }
    }

    .view-cnt {
        margin-left: auto;
        height: 20px;
        display: flex;
        align-items: center;

        .view-icon {
            font-size: 18px;
            margin-right: 5px;
        }

        .view-cnt-text {
            font-size: 12px;
        }
    }
}

.container {
    margin-top: 10px;

    .content {
        font-size: 16px;
    }
}

.topic-scroll-container {
    width: 100%;
    // 这个属性，表示当内容宽度超过容器宽度时，自动显示水平滚动条
    overflow-x: auto;
    overflow-y: hidden;
    // 防止内容换行
    white-space: nowrap;
    padding: 10px 0;
    background-color: #fff;

    // 隐藏WebKit浏览器（如Chrome、Safari）的滚动条
    &::-webkit-scrollbar {
        display: none;
    }

    // 隐藏IE/Edge浏览器的滚动条
    -ms-overflow-style: none;
    // 隐藏Firefox浏览器的滚动条
    scrollbar-width: none;
}

.topic-scroll-wrapper {
    :deep(.img) {
        width: 50px;
        height: 50px;
    }

    display: inline-block;
    padding: 0 15px;
    text-align: left;
}

.topic-item {
    display: inline-block;

    &:last-child {
        margin-right: 0;
    }

    .topic-name {
        width: 70px;
        height: 30px;
        margin-right: 10px;
        border-radius: 5px;
        text-align: center;
        line-height: 30px;
        font-size: 12px;
        margin-top: 5px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background-color: #fef6fb;
        color: #f9b5df;
        font-weight: bold;
    }
}

.file-scroll-container {
    width: 100%;
    // 移除水平滚动，改为正常布局
    overflow-x: hidden;
    overflow-y: hidden;
    padding: 10px 0;
    background-color: #fff;
}

.file-scroll-wrapper {
    :deep(.img) {
        width: 100%;
        height: 100%;
    }

    // 移除内联块显示
    display: block;
    padding: 0 15px;
}

.file-item {
    // 使用网格布局
    display: inline-block;
    width: calc((100% - 20px) / 3); // 一行三张，减去间距
    margin-right: 10px;
    margin-bottom: 10px;

    // 移除之前的样式
    &:last-child {
        margin-right: 10px; // 保持一致的右边距
    }

    .file-image {
        width: 100%;
        height: 100px; // 固定高度或根据需要调整
        object-fit: cover; // 保持图片比例并填充容器
    }
}

// 确保每行最后一张图片没有右边距
.file-item:nth-child(3n) {
    margin-right: 0;
}

.location {
    margin-top: 10px;
    display: flex;
    align-items: center;
    color: #999;
    font-size: 12px;
}

.function {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .like-comment,
    .collection-share {
        display: flex;
    }

    .likes,
    .comment,
    .collection,
    .share {
        margin-right: 10px;
    }

    :deep(.van-icon) {
        font-size: 16px;
        margin-right: 3px;
    }
}

.comments {
    margin-top: 10px;
    background-color: white;
    height: 100vh;
    overflow-y: auto;
}

.comment-header {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    font-size: 16px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    font-weight: 600;

    .comment-title {
        font-size: 16px;
    }
}

.comment-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px 15px;
}

.comment-item {
    margin-bottom: 15px;
}

.comment-user {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.comment-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    margin-right: 10px;
}

.comment-nickname {
    font-size: 14px;
    color: #666;
}

.comment-content {
    display: flex;
    font-size: 14px;
    margin-bottom: 5px;
}

.comment-time {
    font-size: 12px;
    color: #999;
}

.comment-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .actions {
        display: flex;
        align-items: center;
        font-size: 12px;

        .comment-user {
            margin-top: 5px;
            margin-right: 10px;
        }

        .delete-comment,
        .comment-like {
            margin-top: 3px;
            margin-right: 10px;
            font-size: 16px;
        }
    }
}

.second-comment {
    margin-left: 30px;

    .second-comment-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .actions {
            display: flex;
            align-items: center;
            font-size: 12px;

            .delete-comment,
            .comment-like {
                margin-right: 10px;
                font-size: 16px;
            }
        }
    }
}

.no-comments {
    text-align: center;
    padding: 20px;
    color: #999;
}

.publish {
    margin-left: 10px;
    margin-right: 10px;
    display: flex;
    align-items: center;

    .avatar-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }

    .publish-container {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        flex: 1;

        .publish-input {
            margin-left: 10px;
            flex: 1;

            textarea {
                width: 100%;
                height: 30px;
                padding-top: 3px;
                margin-right: 10px;
                background-color: #f3f4f6;
                font-size: 14px;
                border: 1px solid #e5e5e5;
                border-radius: 15px;
                resize: none;
                outline: none;

                &:focus {
                    border-color: #1989fa;
                }
            }
        }

        .publish-at {
            margin-left: 10px;
            width: 20px;
            height: 30px;
            font-size: 18px;
        }

        .publish-button {
            margin-left: 10px;
        }
    }

    :deep(.van-button) {
        margin-bottom: 10px;
        height: 30px;
        border-radius: 30px;
    }

}

.avatar-scroll-container {
    display: none;
    width: 100%;
    // 这个属性，表示当内容宽度超过容器宽度时，自动显示水平滚动条
    overflow-x: auto;
    overflow-y: hidden;
    // 防止内容换行
    white-space: nowrap;
    background-color: #fff;

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
}

.avatar-item {
    position: relative;
    height: 40px;
    display: inline-block;
    text-align: center;
    margin-right: 20px;

    &:last-child {
        margin-right: 0;
    }

    .avatar-name {
        font-size: 12px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .avatar-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 3px;
    }
}

.show-at {
    display: block;
}

.select-style {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    z-index: 999;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity .2s ease;

    .select-icon {
        font-size: 18px !important;
        margin-left: 1px;
    }

    &.show-select {
        opacity: 1;
    }
}
</style>