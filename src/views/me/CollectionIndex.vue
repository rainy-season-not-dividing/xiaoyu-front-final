<script setup>
import { onMounted } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSelfAllPost, deleteSelfPost, cancelCollectPost } from '@/api/posts'
// import { useUserStore } from '@/stores'
import { timeAgo } from '@/utils/timeFormat'
import { getSelfAllCollection } from '@/api/user'


// const userStore = useUserStore()




const router = useRouter()
let showconfirm = ref(false);
let deleteId = ref(0);
// 添加管理状态
const isManaging = ref(false)


// const userId = userStore.userInfo.id;

const onClickLeft = () => history.back();


// 切换管理状态
const onClickRight = () => {
    isManaging.value = !isManaging.value
}

const form = ref([]);
//正式
onMounted(async () => {
    const { data: { data } } = await getSelfAllCollection();
    form.value = data.list;
}
)





//点击文章旁边的删除按钮
const deleteArticle = (id, event) => {
    //禁用页面刷新
    event.stopPropagation()
    event.preventDefault()
    console.log("准备取消收藏文章:" + id);
    //调用确认是否删除的模态框
    deleteId.value = id;
    showconfirm.value = true;
    console.log("showconfirm:" + showconfirm.value);

};



//点击模态框上的删除按钮
const deleteArticleConfirm = async () => {
    console.log("确定取消收藏文章:");
    //发送删除请求,取消收藏id就是deleteId.value
    //刷新页面
    await cancelCollectPost(deleteId.value);

    window.location.reload();

};
//点击文章
const goDetail = (id) => {
    console.log("准备进入文章详情页");
    //跳转页面
    //path: '/posts/detail/:id',
    router.push(`/posts/detail/${id}`);
};

//点击返回退到上一级
//点击文章跳入文章详情页
//获取文章数据内容
//点击编辑跳入编辑页
//点击删除弹出是否删除，若是，则发送删除请求
//写删除页面，用fixed出现在正中间，用模态框


//数据：
//点击删除和编辑框，需要参数为文章id
//点击文章本身，需要文章id
//向服务器发送请求获得数据并解析


//方法解决：
//删除和编辑按钮的onclick方法传入文章id,之后跳转页面
//点击文章本身的onclick方法传入文章id，之后跳转页面
</script>

<template>

    <van-sticky class="sticky-component">
        <van-nav-bar title="我的收藏" left-text="" :right-text="isManaging ? '取消' : '管理'" left-arrow
            @click-left="onClickLeft" @click-right="onClickRight" class="custom-nav-bar" />
    </van-sticky>
    <div class="main">
        <div class="article" v-for="item in form" :key="item.id" @click="goDetail(item.id)">
            <div class="article-grid">
                <!-- 头像和昵称 -->
                <div class="information">
                    <img :src="item.user.avatarUrl" alt="头像" class="profile">
                    <span class="nickname">{{ item.user.nickname }}</span>
                </div>




                <div class="content">
                    <p>{{ item.content }}</p>
                </div>
                <div class="img-show">
                    <img v-for="file in item.files" :key="file.id" :src="file.fileUrl" alt="图片" class="img1">
                </div>
                <div class="tag-show">
                    <div class="tag">{{ timeAgo(item.createdAt) }}</div>
                    <div class="tag" v-for="tag in item.tags" :key="tag.id">{{ tag.name }}</div>
                </div>
                <div class="engage-show">
                    <div class="tag"><van-icon name="like-o" />{{ item.stats.likeCnt }}</div>
                    <div class="tag"><van-icon name="comment-o" />{{ item.stats.commentCnt }}</div>
                </div>
            </div>




            <div class="actions" :style="{ opacity: isManaging ? 1 : 0 }">
                <van-button class="del" @click.stop="deleteArticle(item.id, $event)">取消收藏</van-button>
            </div>
        </div>
    </div>
    <div class="no-content" v-show="form.length == 0">
        <div>暂时没有帖子</div>
    </div>
    <div class="footer">

    </div>
    <div class="modal" v-show="showconfirm">
        <div class="modal-content">
            <h2>确定取消收藏该文章?</h2>
            <div class="yes-no">
                <van-button type="primary" class="yes" @click="deleteArticleConfirm">确定</van-button>
                <van-button class="no" @click="showconfirm = False">取消</van-button>
            </div>
        </div>
    </div>

</template>


<style lang="less" scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.no-content {
    position: fixed;
    inset: 0;
    /* top:0 right:0 bottom:0 left:0 */
    margin: auto;
    /* 关键：自动把剩余空间均分给四边 */
    width: max-content;
    /* 或具体值，如 200px */
    height: max-content;
    /* 或具体值，如 60px */
    color: rgb(156, 156, 156);
}

.action {
    opacity: 1;
}

.profile {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: aquamarine;
}

.information {
    padding-top: 10px;
    text-align: left;

}

.modal {

    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    overflow-y: auto;
}

.modal-content {
    position: fixed;
    inset: 0;
    /* top:0 right:0 bottom:0 left:0 */
    margin: auto;
    /* 关键：自动把剩余空间均分给四边 */
    width: max-content;
    /* 或具体值，如 200px */
    height: max-content;
    /* 或具体值，如 60px */
    border-radius: 5vw;
    height: 60vh;
    width: 80vw;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);


    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15vh;
    /* 标题与按钮组间距 */
    text-align: center;
}

.yes,
.no {
    width: 20vw;
    height: 10vh;
    margin: 0 5vw;
}

.btn {
    width: 150px;
    height: 100px;
    transition: all .3s;

}

.btn:hover {
    box-shadow: 1px 1px 5px rgba(0, 0, 0, .5);
    transform: scale(1.05, 1.05);
}

.sticky-component {
    top: 0;
    left: 0;
}

.main {
    display: grid;
    grid-template-columns: auto;
    text-align: center;
}

.article {
    position: relative;
    /* 关键：作为绝对定位元素的参考 */
    margin-left: 5%;
    width: 90%;

    background-color: rgb(250, 250, 250);
    margin-top: 3%;
    border-radius: 20px;
    transition: all .3s;
    opacity: 1;
    display: flex;
    /* 让文章内容和操作区可以更好地布局 */
    padding-left: 20px;
    /* 给文章文字留点空间 */
    box-shadow: 5px 4px 15px rgba(0, 0, 0, 0.2);
    /* 优化阴影 */
}

.article:hover {
    transform: scale(1.05, 1.05);
    /* 微调缩放效果 */
    box-shadow: 20px 16px 60px rgba(0, 0, 0, 0.2);
    /* 优化阴影 */
    cursor: pointer;
    z-index: 20;
    opacity: 0.9;
}

/* --- 核心修改部分 --- */
.actions {

    /* 1. 使用绝对定位，使其脱离文档流 */
    position: absolute;
    /* 2. 将其定位在 .article 的右上角 */
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    /* 垂直居中对齐 */
    /* 3. 使用 flex 布局让按钮垂直排列 */
    display: flex;
    flex-direction: column;
    gap: 10%;
    /* 按钮之间的间距 */
    transition: all .3s;

    opacity: 1;
    opacity: 0;
    width: 50%;
    height: 100%;
    justify-content: center;
}

.edit,
.del,
.yes,
.no {

    position: relative;
    border-radius: 2vw;
    border: none;
    padding: 5px 7px;
    /* 按钮内边距 */
    z-index: 1;
    /* 移除按钮自身的绝对定位，让它们受 .actions 容器管理 */
    /* position: absolute;  <-- 已删除 */
    /* z-index: 50;        <-- 已删除 */

    background: rgba(255, 255, 255, 0.5);
    /* 稍微提高背景不透明度，效果更好 */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: rgba(50, 50, 50, 0.8);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow:
        0 4px 15px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.edit,
.del {
    left: 60%;
    width: 45%;
    height: 30%;
    font-size: 15px;
}

.edit:hover,
.no:hover {
    transform: translateY(-15%);
    /* 鼠标悬浮时轻微上浮 */
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    background-color: rgba(89, 241, 109, 0.5);
}

.del:hover,
.yes:hover {
    transform: translateY(-15%);
    /* 鼠标悬浮时轻微上浮 */
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    background-color: rgba(240, 52, 52, 0.5);
}

.actions:hover {
    opacity: 1;
}

.message {
    background-color: rgb(243, 244, 246);
    font-size: 30px;
}

.article-grid {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 5px;

}

.img-show {
    margin: 0 5px;
    /*background-color:cadetblue;*/

    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    gap: 5%;
}

.img1 {
    width: 30%;
    background-color: blanchedalmond;
    border-radius: 5px;

}

.tag-show,
.engage-show {
    display: flex;
    flex-wrap: wrap;
    gap: 3%;
    /* background-color: aqua;*/

}

.tag-show {
    margin: 20px 5px 0 5px;
    justify-content: left;
}

.engage-show {
    justify-content: right;
    margin: 0 30px 5px 30px;
}

.tag {
    /* padding:15px 30px; */
    padding: 0px 3px;
    background-color: rgb(244, 242, 242);
    border-radius: 30px;
    font-size: 15px;
    /* font-size: 40px; */
    color: rgb(73, 73, 73)
}

.content {
    /*background-color: aquamarine;*/
    text-align: left;
    margin: 5px 5px;
    /* 添加以下样式实现只显示两行文字 */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 1.5;
    /* 设置行高，可根据需要调整 */
}
</style>
