<script setup>
import { ref, computed, onMounted } from 'vue'
import { publishPost, getPostDetail, updatePost, getAllTopic } from '@/api/posts'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import defaultAvatar from '@/assets/image/default.png'
import { uploadFile } from '@/api/upload'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()

const isEdit = computed(() => !!route.params.id)

const form = ref({
    title: '',
    content: '',
    visibility: '',
    poiLat: '',
    poiLng: '',
    poiName: '',
    files: [],
    topics: []
})

const fileList = ref([])

const topicList = ref([])

onMounted(async () => {
    const { data: { data } } = await getAllTopic()
    topicList.value = data
})

onMounted(async () => {
    if (isEdit.value) {
        const { data: { data } } = await getPostDetail(route.params.id)
        form.value = data
        form.value.poiName = '武汉理工大学'
        // 处理文件回显
        if (data.files && data.files.length > 0) {
            // 用于存储信息
            form.value.files.value = data.files.map(file => file.fileUrl)
            // 用于预览
            fileList.value = data.files.map(file => ({
                url: file.fileUrl  // 用于预览的图片链接
            }))
        }
    }
})

const showTopicList = ref(false)

const selectTopic = (topicId) => {
    if (form.value.topics.includes(topicId)) {
        form.value.topics.splice(form.value.topics.indexOf(topicId), 1)
    } else {
        form.value.topics.push(topicId)
    }
}

const showPrivacyList = ref(false)

const privacyList = ref([
    {
        text: '公开',
        value: 'PUBLIC'
    },
    {
        text: '仅朋友可见',
        value: 'FRIEND'
    },
    {
        text: '同校区可见',
        value: 'CAMPUS'
    }
])

// 获取用户位置
const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // 成功回调
            (position) => {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude

                // 将位置信息保存到表单中
                form.value.poiLat = latitude
                form.value.poiLng = longitude

                // 可以调用逆地理编码获取具体地址名称
                getAddressFromCoordinates(latitude, longitude)
            },
            // 错误回调
            (error) => {
                console.error('获取位置失败:', error)
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showFailToast("用户拒绝了地理位置请求")
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showFailToast("位置信息不可用")
                        break;
                    case error.TIMEOUT:
                        showFailToast("请求超时")
                        break;
                    default:
                        showFailToast("发生未知错误")
                        break;
                }
            },
            {
                // 选项
                enableHighAccuracy: true, // 高精度
                timeout: 10000,           // 超时时间10秒
                maximumAge: 60000         // 缓存时间1分钟
            }
        );
    } else {
        console.log("浏览器不支持地理位置");
    }
}

// 逆地理编码：根据经纬度获取地址名称（需要调用地图API）
const getAddressFromCoordinates = (lat, lng) => {
    // 这里可以调用高德地图、百度地图或腾讯地图的逆地理编码API
    // 示例（使用高德地图API）：
    // 要申请api密钥 后端请求获取密钥

    /* fetch(`https://restapi.amap.com/v3/geocode/regeo?key=YOUR_KEY&location=${lng},${lat}`)
      .then(response => response.json())
      .then(data => {
        if (data.regeocode) {
          form.value.poiName = data.regeocode.formatted_address;
        }
      })
      .catch(error => {
        console.error('获取地址信息失败:', error);
      }); */
}

// 正式
/* onMounted(() => {
    getLocation()
}) */

const handleRead = async (file) => {
    // 上传图片后直接发请求给后端
    const fd = new FormData()
    fd.append('file', file.file)
    const { data: { data } } = await uploadFile(fd)
    form.value.files.push(data)
}

const handleDelete = (file, detail) => {
    // 获取要删除文件的索引
    const index = detail.index

    // 从预览列表中删除
    fileList.value.splice(index, 1)

    // 从表单数据中删除对应的文件信息
    if (form.value.files[index]) {
        form.value.files.splice(index, 1)
    }

    // 表示允许删除操作继续进行
    return true
}

const onSubmit = async () => {
    if (isEdit.value) {
        console.log("调用的update接口")
        await updatePost(route.params.id, form.value)
        await router.back()
        showSuccessToast('保存成功')
    } else {
        console.log("调用的publish接口")
        await publishPost(form.value)
        await router.push('/')
        showSuccessToast('发布成功')
    }
}

const handlePrivacy = (val) => {
    form.value.visibility = val
}
</script>

<template>
    <van-nav-bar left-text="取消" @click-left="router.back()" fixed>
        <template #title>
            {{ isEdit ? '编辑动态' : '发布动态' }}
        </template>
        <template #right>
            <van-button round type="primary" plain @click="onSubmit">{{ isEdit ? '保存' : '发布' }}</van-button>
        </template>
    </van-nav-bar>

    <div class="container">

        <div class="avatar-nickname">
            <img :src="userStore.userInfo.avatar || defaultAvatar" class="avatar-image" />
            <div class="nickname">{{ userStore.userInfo.nickname }}</div>
        </div>

        <van-field class="title" v-model="form.title" autosize type="textarea" maxlength="20" placeholder="请填写标题~"
            show-word-limit />

        <van-field class="content" v-model="form.content" autosize type="textarea" maxlength="300"
            placeholder="分享你的校园日常吧~" show-word-limit />

        <div class="photo">
            <p class="photo-title">
                <van-icon class-prefix="my-icon" name="tupian" color="#1677ff" />
                <span class="title-text">
                    添加图片（可选）
                </span>
            </p>

            <van-uploader v-model="fileList" :after-read="handleRead" :before-delete="handleDelete" class="uploader" />

        </div>

        <div class="function">
            <div class="topics">
                <div class="list" :class="{ 'list-show': showTopicList }">
                    <div v-for="item in topicList" :key="item.id" class="item" @click="selectTopic(item.id)"
                        :class="{ 'selected': form.topics.includes(item.id) }">
                        {{ item.name }}
                    </div>
                </div>

                <div class="title" @click="showTopicList = !showTopicList">
                    <div class="icon">
                        <van-icon class-prefix="my-icon" name="hashjinghao" />
                    </div>
                    <div class="text">
                        话题
                    </div>
                </div>
            </div>

            <div class="privacy">
                <div class="list" :class="{ 'list-show': showPrivacyList }">
                    <div v-for="item in privacyList" :key="item.value" class="item" @click="handlePrivacy(item.value)"
                        :class="{ 'selected': form.visibility === item.value }">
                        {{ item.text }}
                    </div>
                </div>

                <div class="title" @click="showPrivacyList = !showPrivacyList">
                    <div class="icon">
                        <van-icon class-prefix="my-icon" name="jiesuo" />
                    </div>
                    <div class="text">
                        权限
                    </div>
                </div>
            </div>
        </div>


        <div class="position">
            <van-icon name="location-o" />
            <div class="text">
                {{ form.poiName }}
            </div>
        </div>

        <div class="warn">
            <div class="warn-text">
                <p class="text-span">
                    <van-icon class-prefix="my-icon" name="dian" />
                    请勿发布任何违反法律法规、校园规定的内容
                </p>
                <p class="text-span">
                    <van-icon class-prefix="my-icon" name="dian" />
                    涉及他人、商业广告的内容将被限制发布
                </p>
            </div>
        </div>

    </div>
</template>

<style lang="less" scoped>
// 添加清除浮动的样式
.clearfix {
    clear: both;
}

.uploader {
    height: auto; // 修改高度
}

:deep(.van-nav-bar__text) {
    color: #999999;
    font-size: 16px;
}

:deep(.van-button) {
    width: 50px;
    height: 30px;
    font-size: 14px;
    padding: 0;
}

.container {
    min-height: 100vh; // 修改为min-height
    background-color: #fafafc;
    position: relative;
    padding-top: 10px;
    padding-bottom: 20px; // 添加底部padding

    .avatar-nickname {
        margin-top: 50px;
        margin-left: 15px;
        display: flex;
        align-items: center;

        .avatar-image {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }

        .nickname {
            margin-left: 10px;
            font-size: 16px;
        }
    }

    .title {
        margin-top: 10px;
        height: 50px;
    }

    .content {
        height: 150px;
    }

    .photo {
        margin-top: 10px;
        background-color: white;

        .photo-title {
            margin-bottom: 10px; // 添加底部边距
        }

        .title-text {
            font-size: 14px;
            font-weight: bold;
            color: #57616d;
        }

        :deep(.van-uploader__wrapper) {
            display: grid;
            grid-template-columns: repeat(3, 1fr); // 使用fr单位
            grid-gap: 10px;
        }

        :deep(.van-uploader__preview),
        :deep(.van-uploader__upload) {
            margin-left: 5px;
            width: calc((100vw - 60px) / 3);
            aspect-ratio: 1;
            height: auto;
        }

        :deep(.van-uploader__preview-image) {
            width: calc((100vw - 50px) / 3); // 计算宽度，考虑间距
            aspect-ratio: 1;
            height: auto;
            object-fit: cover;
            border-radius: 4px; // 添加圆角
        }
    }

    .function {
        margin: 20px 15px; // 统一设置margin
        background-color: #fafafc;
        display: flex;
        justify-content: center;
        font-size: 16px;
        color: #9ca3af;

        .topics,
        .privacy {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 48%;
            height: 80px; // 固定高度
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); // 添加阴影

            .title {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .list {
                position: absolute;
                width: 100%;
                max-height: 150px;
                overflow-y: auto;
                background-color: white;
                border: 1px solid #e5e5e5;
                border-radius: 5px;
                display: none;
                bottom: 100%; // 修改定位
                left: 0;
                z-index: 100;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

                &.list-show {
                    display: block;
                }

                .item {
                    text-align: center;
                    padding: 8px 0;
                    border: 1px solid #f0f0f0;
                    margin-bottom: 1px;

                    &.selected {
                        color: #60a5fa;
                        border: 1px solid #60a5fa;
                        border-radius: 5px;
                    }
                }
            }
        }

        .topics {
            border-right: 1px solid #e5e5e5;
        }
    }
}

.position {
    margin: 20px 15px; // 统一设置margin
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #9ca3af;
}

.warn {
    margin: 0 15px; // 统一设置margin

    .warn-text {
        height: 60px;
        background-color: #f3f4f6;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .text-span {
            margin: 0;
            padding: 2px 10px;
            font-size: 14px;
            color: #9da3af;
        }
    }
}
</style>