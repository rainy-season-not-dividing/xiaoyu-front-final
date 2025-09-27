<script setup>
// 定义组件属性
import { onMounted } from 'vue'

const props = defineProps({
    avatarUrl: {
        type: String
    },
    nickname: {
        type: String
    },
    message: {
        type: String,
        required: true
    },
    onClick: {
        type: Function,
        default: null
    }
})

const visible = defineModel('visible', { type: Boolean, default: false })

// 点击弹窗进如聊天页
const click = () => {
    visible.value = false
    if (props.onClick) {
        props.onClick()
    }
}

onMounted(() => {
    setTimeout(() => {
        visible.value = false
    }, 3000)
})
</script>

<template>
    <div class="message-modal" v-if="visible" @click="click">
        <div class="avatar">
            <img class="avatar-image" :src="props.avatarUrl" />
        </div>
        <div class="message-content">
            <div class="nickname">{{ props.nickname }}</div>
            <div class="content">{{ props.message }}</div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.message-modal {
    padding: 10px;
    display: flex;
    position: fixed;
    top: 45px;
    left: 0;
    right: 0;
    height: 75px;
    align-items: center;
    background: #E8EFFB;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    overflow: hidden;
}

.avatar {

    .avatar-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }
}


.message-content {
    padding: 20px;

    .nickname {
        font-size: 18px;
        font-weight: bold;
    }

    .content {
        font-size: 16px;
        margin-top: 8px;
    }
}
</style>
