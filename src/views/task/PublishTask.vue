<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publishTask, editTask, getTaskDetail, getAllTaskTag } from '@/api/task'
import { uploadFile } from '@/api/upload'

const route = useRoute()
const router = useRouter()

// 判断当前是编辑还是新增
const isEdit = computed(() => !!route.params.id)

const form = ref({
    title: '',
    content: '',
    reward: '',
    visibility: 'PUBLIC',
    expireAt: '',
    tagIds: [],
    fileUrls: []
})

const fileList = ref([])

// 回显
onMounted(async () => {
    if (isEdit.value) {
        const { data: { data } } = await getTaskDetail(route.params.id)
        form.value = {
            title: data.title,
            content: data.content,
            reward: data.reward,
            visibility: data.visibility,
            expireAt: data.expireAt,
            tagIds: data.tags.map(tag => tag.id)
        }
        // 处理文件回显
        if (data.files && data.files.length > 0) {
            // 用于存储信息
            form.value.fileUrls = data.files.map(file => file.fileUrl)
            // 用于预览
            fileList.value = data.files.map(file => ({
                url: file.fileUrl  // 用于预览的图片链接
            }))
        }
    }
})

const handleRead = async (file) => {
    // 上传图片后直接发请求给后端
    const fd = new FormData()
    fd.append('file', file.file)
    const { data: { data } } = await uploadFile(fd)
    form.value.fileUrls.push(data)
}

const handleDelete = (file, detail) => {
    // 获取要删除文件的索引
    const index = detail.index

    // 从预览列表中删除
    fileList.value.splice(index, 1)

    // 从表单数据中删除对应的文件信息
    if (form.value.fileUrls[index]) {
        form.value.fileUrls.splice(index, 1)
    }

    // 表示允许删除操作继续进行
    return true
}

// 提交：区分新增 修改
const onSubmit = async () => {
    if (isEdit.value) {
        console.log(form.value.fileUrls)
        await editTask(route.params.id, form.value)
        await router.back()
        showSuccessToast('修改成功')
    } else {
        await publishTask(form.value)
        await router.back()
        showSuccessToast('发布成功')
    }
}

const showDate = ref(false)
const dateResult = ref('')
const currentDate = ref([
    new Date().getFullYear().toString(),
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
    new Date().getDate().toString().padStart(2, '0')
])
const minDate = new Date(1900, 0, 1)
const maxDate = new Date(2100, 11, 31)
const onConfirmDate = ({ selectedValues }) => {
    dateResult.value = selectedValues.join('-')
    showDate.value = false
}

const showTime = ref(false)
const timeResult = ref('')
const columnsType = ['hour', 'minute', 'second'];
const currentTime = ref([
    new Date().getHours().toString().padStart(2, '0'),
    new Date().getMinutes().toString().padStart(2, '0'),
    new Date().getSeconds().toString().padStart(2, '0')
])
const onTimeConfirm = ({ selectedValues }) => {
    timeResult.value = selectedValues.join(':')
    showTime.value = false
}


const privacy = ref([
    { text: '所有人可见', value: 'PUBLIC' },
    { text: '仅好友可见', value: 'FRIEND' },
    { text: '同校区可见', value: 'CAMPUS' }
])
const showPrivacy = ref(false)
const privacyResult = ref('')
const onConfirmPrivacy = ({ selectedOptions }) => {
    privacyResult.value = selectedOptions[0]?.text
    form.value.visibility = selectedOptions[0]?.value
    showPrivacy.value = false
}

const taskTags = ref([])

onMounted(async () => {
    const { data: { data } } = await getAllTaskTag()
    taskTags.value = data
})

const selectTag = (id) => {
    if (form.value.tagIds.includes(id)) {
        form.value.tagIds.splice(form.value.tagIds.indexOf(id), 1)
    } else {
        form.value.tagIds.push(id)
    }
}

watch([() => dateResult.value, () => timeResult.value], () => {
    if (dateResult.value && timeResult.value) {
        const dateTimeString = `${dateResult.value} ${timeResult.value}`
        form.value.expireAt = dateTimeString
    }
})
</script>
<template>
    <div class="container">
        <van-nav-bar :title="isEdit ? '编辑任务' : '发布任务'" left-arrow @click-left="router.back()" fixed />
        <van-form @submit="onSubmit" class="form">
            <van-field class="title" name="title" v-model="form.title" label="任务标题"
                :rules="[{ required: true, message: '请填写标题' }]" />

            <van-field v-model="form.content" rows="5" label="任务内容" type="textarea" maxlength="300"
                placeholder="请输入任务内容" show-word-limit />

            <div class="upload-label">
                上传文件
            </div>

            <van-uploader v-model="fileList" :after-read="handleRead" :before-delete="handleDelete" />

            <van-field class="reward" v-model="form.reward" label="悬赏金额" type="number"
                :rules="[{ required: true, message: '请填写金额' }]" />

            <div class="tags">
                <div class="label">
                    标签
                </div>
                <div class="tag-scroll-container">
                    <div class="tag-scroll-wrapper">
                        <div v-for="item in taskTags" :key="item.id" class="tag-item" @click="selectTag(item.id)"
                            :class="{ 'tag-item-active': form.tagIds.includes(item.id) }">
                            <div class="tag-name">{{ item.name }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <van-field v-model="privacyResult" is-link readonly name="picker3" label="权限" placeholder="点击设置权限"
                @click="showPrivacy = true" />
            <van-popup v-model:show="showPrivacy" position="bottom">
                <van-picker :columns="privacy" @confirm="onConfirmPrivacy" @cancel="showPrivacy = false" />
            </van-popup>

            <van-field v-model="dateResult" is-link readonly name="picker1" label="选择截止日期" placeholder="点击选择日期"
                @click="showDate = true" />
            <van-popup v-model:show="showDate" :style="{ padding: '64px' }" round position="bottom">
                <van-date-picker v-model="currentDate" title="选择日期" :min-date="minDate" :max-date="maxDate"
                    @confirm="onConfirmDate" @cancel="showDate = false" />
            </van-popup>

            <van-field v-model="timeResult" is-link readonly name="picker2" label="选择截止时间" placeholder="点击选择时间"
                @click="showTime = true" />
            <van-popup v-model:show="showTime" :style="{ padding: '64px' }" round position="bottom">
                <van-time-picker v-model="currentTime" title="选择时间" :columns-type="columnsType" @confirm="onTimeConfirm"
                    @cancel="showTime = false" />
            </van-popup>

            <div class="btn">
                <van-button round block type="primary" native-type="submit" class="submit-btn">
                    {{ isEdit ? '保存修改' : '立即发布' }}
                </van-button>
            </div>
        </van-form>
    </div>
</template>

<style scoped lang="less">
:deep(.van-uploader) {
    margin-top: 15px;
    margin-left: 15px;
}

.upload-label {
    margin-top: 15px;
    margin-left: 15px;
    font-size: 14px;
    color: #323233;
}

.container {
    height: 100vh;
    background-color: white;

    .form {
        height: 100%;
        margin-top: 45px;
    }

    .title,
    .reward {
        height: 68px;
    }

    .tags {
        display: flex;
        align-items: center;
        background-color: white;

        .label {
            font-size: 14px;
            width: 50px;
            margin-left: 15px;
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
                border-radius: 5px;
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
                background-color: #fef6fb;
                color: #f9b5df;
                font-weight: bold;
            }
        }
    }

    .btn {
        display: flex;
        justify-content: center;
        align-items: center;

        .submit-btn {
            margin-top: 100px;
            margin-bottom: 30px;
            width: 280px;
        }
    }


}
</style>