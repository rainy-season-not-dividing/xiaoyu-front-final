<script setup>
import { useRouter } from 'vue-router';
import { onMounted, ref, computed } from 'vue'
import { getUserInfo, updateUerInfo } from '@/api/user'
import { uploadFile } from '@/api/upload'

const formModel = ref({
    nickname: '',
    avatarUrl: '',
    birthday: '',
    gender: 0,
    campusName: '',
    privacyBirthday: '',
    privacyMobile: '',
    privacyFans: ''
})

const avatar = ref([])

const campusName = ref()

const campusNames = [
    { text: '南湖', value: 'NANHU' },
    { text: '马房山', value: 'MAFANGSHAN' },
    { text: '余家头', value: 'YUJIATOU' }
]

const showCampusPicker = ref(false)

const onCampusConfirm = ({ selectedOptions }) => {
    campusName.value = selectedOptions[0]?.text
    formModel.value.campusName = selectedOptions[0]?.value
    showCampusPicker.value = false
}

onMounted(async () => {
    const { data: { data } } = await getUserInfo()
    formModel.value = data
    campusName.value = campusNames.find(item => item.value === data.campusName)['text']
    avatar.value = [
        { url: data.avatarUrl }
    ]
    console.log(avatar.value)
})

const router = useRouter()

const showPicker = ref(false)
const genders = ref([
    { text: '男', value: 1 },
    { text: '女', value: 2 },
])
const showGender = computed(() => formModel.value.gender === 1 ? '男' : formModel.value.gender === 2 ? '女' : '')
const onConfirm = ({ selectedOptions }) => {
    formModel.value.gender = selectedOptions[0]?.text === '男' ? 1 : 2
    showPicker.value = false
}

const currentDate = ref([
    new Date().getFullYear().toString(),
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
    new Date().getDate().toString().padStart(2, '0')
])
const minDate = new Date(1900, 0, 1)
const maxDate = new Date(2100, 11, 31)
const showDatePicker = ref(false)
const onDateConfirm = ({ selectedValues }) => {
    formModel.value.birthday = selectedValues.join('-')
    showDatePicker.value = false
}

const handleRead = async (file) => {
    // 上传图片后直接发请求给后端
    const fd = new FormData()
    fd.append('file', file.file)
    console.log(file)
    const { data: { data } } = await uploadFile(fd)
    formModel.value.avatarUrl = data
}

const onSubmit = async () => {
    await updateUerInfo(formModel.value)
    await router.push('/me')
    showSuccessToast('修改成功')
}

</script>

<template>
    <van-nav-bar title="资料修改" left-arrow @click-left="router.back()" />
    <van-form @submit="onSubmit">

        <div class="avatar-container">
            <div class="label">头像</div>
            <van-uploader v-model="avatar" :after-read="handleRead" max-count="1" class="avatar" reupload
                :deletable="false" />
        </div>


        <van-field v-model="formModel.nickname" name="昵称" label="昵称" placeholder="请输入昵称" :rules="[{ required: true, message: '请填写昵称' },
        { pattern: /^.{1,30}$/, message: '昵称长度为1-30个字符' }, { pattern: /^[^\d]/, message: '昵称不能以数字开头' }
        ]" />

        <van-field v-model="showGender" is-link readonly name="picker" label="性别" placeholder="点击选择性别"
            @click="showPicker = true" />
        <van-popup v-model:show="showPicker" position="bottom">
            <van-picker :columns="genders" @confirm="onConfirm" @cancel="showPicker = false" />
        </van-popup>

        <van-field v-model="formModel.birthday" is-link readonly name="datePicker" label="生日" placeholder="点击选择日期"
            @click="showDatePicker = true" />
        <van-popup v-model:show="showDatePicker" position="bottom">
            <van-date-picker @confirm="onDateConfirm" @cancel="showDatePicker = false" :min-date="minDate"
                :max-date="maxDate" v-model="currentDate" />
        </van-popup>

        <van-field v-model="campusName" is-link readonly name="campusPicker" label="校区" placeholder="点击选择校区"
            @click="showCampusPicker = true" />
        <van-popup v-model:show="showCampusPicker" position="bottom">
            <van-picker title="校区" :columns="campusNames" @confirm="onCampusConfirm"
                @cancel="showCampusPicker = false" />
        </van-popup>

        <van-field name="privacy_mobile" label="手机号可见范围">
            <template #input>
                <van-radio-group v-model="formModel.privacyMobile">
                    <van-radio :name="0">公开</van-radio>
                    <van-radio :name="1">好友可见</van-radio>
                    <van-radio :name="2">仅自己可见</van-radio>
                </van-radio-group>
            </template>
        </van-field>

        <van-field name="privacy_birthday" label="生日可见范围 ">
            <template #input>
                <van-radio-group v-model="formModel.privacyBirthday">
                    <van-radio :name="0">公开</van-radio>
                    <van-radio :name="1">好友可见</van-radio>
                    <van-radio :name="2">仅自己可见</van-radio>
                </van-radio-group>
            </template>
        </van-field>

        <van-field name="privacy_fans" label="粉丝列表可见范围">
            <template #input>
                <van-radio-group v-model="formModel.privacyFans">
                    <van-radio :name="0">公开</van-radio>
                    <van-radio :name="1">好友可见</van-radio>
                    <van-radio :name="2">仅自己可见</van-radio>
                </van-radio-group>
            </template>
        </van-field>

        <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
                提交
            </van-button>
        </div>
    </van-form>

</template>

<style lang="less" scoped>
:deep(.van-image__img) {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-container {
    display: flex;
    background-color: white;
    align-items: center;
    padding: 10px 16px;

    .label {
        width: 80px;
        font-size: 14px;
        color: #4f4f4f;
    }

    :deep(.van-uploader__preview-image) {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
}
</style>