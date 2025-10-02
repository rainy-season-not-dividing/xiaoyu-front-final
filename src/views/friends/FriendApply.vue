<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import defaultAvatar from '@/assets/image/default.png'
import { acceptFriend, rejectFriend } from '@/api/friends'
import { showFailToast, showSuccessToast } from 'vant'

const route = useRoute()
const router = useRouter()

const campusNames = [
    { text: '南湖', value: 'NANHU' },
    { text: '马房山', value: 'MAFANGSHAN' },
    { text: '余家头', value: 'YUJIATOU' }
]

const userInfo = ref({
    id: route.query.id,
    nickname: route.query.nickname,
    avatarUrl: decodeURIComponent(route.query.avatarUrl || ''),
    verifyMessage: route.query.verifyMessage.substring(route.query.nickname.length + 11) || '请求添加好友',
    campusName: campusNames.find(item => item.value === route.query.campusName)['text'],
})

const handleApply = async () => {
    await acceptFriend(route.query.id)
    router.back()
    showSuccessToast('已成为好友，快去聊天吧')
}

const handleCancel = async () => {
    await rejectFriend(route.query.id)
    router.back()
    showFailToast('已拒绝好友申请')
}
</script>

<template>
    <van-nav-bar title="好友申请" left-arrow @click-left="router.back()" fixed />

    <div class="container">
        <van-cell-group inset>
            <van-cell class="user-info">
                <div class="header">
                    <div class="avatar" @click="router.push(`/user/${userInfo.id}`)">
                        <img class="custom-image" :src="userInfo.avatarUrl || defaultAvatar" />
                    </div>
                    <div class="nickname-gender-campus">
                        <div class="nickname-gender">
                            <div class="nickname">
                                {{ userInfo.nickname || '匿名用户' }}
                            </div>
                            <div class="gender">
                                <van-icon class-prefix="my-icon" name="nan" v-if="userInfo.gender === 1"
                                    color="#1296db" />
                                <van-icon class-prefix="my-icon" name="nvxing" v-else color="#d4237a" />
                            </div>
                        </div>
                        <div class="campus">
                            <div class="campus">{{ userInfo.campusName }}</div>
                        </div>
                    </div>
                    <div class="verify">
                        {{ userInfo.verifyMessage }}
                    </div>
                </div>
            </van-cell>
        </van-cell-group>

        <div class="btn">
            <div class="agree">
                <van-button round type="primary" @click="handleApply" color="#60a5fa">同意申请</van-button>
            </div>
            <div class="refuse">
                <van-button round @click="handleCancel" color="#f3f4f6">拒绝申请</van-button>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
:deep(.van-cell__value) {
    text-align: left;
}

.container {
    margin-top: 60px;

    .header {
        display: flex;
        flex-direction: column;
        align-items: center;

        .avatar {
            .custom-image {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                object-fit: cover;
            }
        }

        .nickname-gender-campus {
            display: flex;
            flex-direction: column;
            align-items: center;

            .nickname-gender {
                display: flex;
                align-items: center;
                font-weight: bold;

                .nickname {
                    margin-top: 5px;
                    margin-right: 5px;
                    font-size: 18px;
                    color: black;
                }

                .gender {
                    margin-top: 3px;
                    font-size: 20px;
                }
            }

            .campus {
                margin-top: 5px;
                font-size: 16px;
            }
        }

        .verify {
            margin-top: 10px;
            padding: 8px 30px;
            border-radius: 15px;
            background-color: #f3f4f6;
            color: #70767b;
            font-size: 16px;
        }
    }

    .btn {
        margin-top: 30px;
        text-align: center;
        margin-left: auto;
        margin-right: auto;

        :deep(.van-button) {
            width: 300px;
            margin-bottom: 10px;
        }

        :deep(.van-button__text) {
            font-size: 16px;
            font-weight: 600;
        }

        .refuse {
            :deep(.van-button__text) {
                color: #4b5563
            }
        }




    }
}
</style>
