<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { timeAgo } from '@/utils/timeFormat'
import { transVisibility, transStatus, transFontColor, transBackGroundColor } from '@/utils/translate'
import { getMyReceiveTaskList } from '@/api/task'
import {cancelTaskOrder,finishTaskOrder} from '@/api/task'



const router = useRouter()

const props = defineProps({
  isManaging: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// // 任务列表数据
const form = ref([])


// // 获取任务列表
const fetchTaskList = async () => {
  try {
    const { data: { data } } = await getMyReceiveTaskList({
      page: currentPage.value,
      size: pageSize.value
    })
    
    if (refreshing.value) {
      form.value = data.list
      refreshing.value = false
    } else {
      form.value = [...form.value, ...data.list]
    }
    
    // 判断是否还有更多数据
    if (form.value.length >= data.pagination.total) {
      finished.value = true
    }
  } catch (error) {
    console.error('获取接收任务列表失败:', error)
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 加载更多
const onLoad = () => {
  if (refreshing.value) return
  
  currentPage.value++
  fetchTaskList()
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  finished.value = false
  currentPage.value = 1
  fetchTaskList()
}

// 初始化加载
onMounted(() => {
  fetchTaskList()
})

const goDetail = (id) => {
  console.log("准备进入任务详情页")
  router.push(`/posts/task?id=${id}`);
}

const finish =async (id, event) => {
  // 处理完成任务逻辑
  console.log('完成任务:', id)
  await finishTaskOrder(id);
  event.stopPropagation()
}
const cancel =async (id, event) => {
  // 处理取消任务逻辑
  console.log('取消任务:', id)
  await cancelTaskOrder(id);
  event.stopPropagation()
}


</script>

<template>
  <div class="main">
    <van-tab title="我接收的">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="article" v-for="item in form" :key="item.id" @click="goDetail(item.id)">
            <div class="message-show">
              <img :src="item.publisher.avatarUrl" alt="头像" class="profile">
              <span class="nickname">{{ item.publisher.nickname }}</span>
            </div>
            <div class="title">
              <span style="font-weight: 600;">{{ item.title }}</span>
              <span class="reward">￥{{ item.reward }}</span>
            </div>

            <div class="content">
              <p>{{ item.content }}</p>
            </div>

            <div class="tag-show">
              <span v-for="tag in item.tags" :key="tag.id" class="tag" :style="{
                color: 'rgb(' + transFontColor(tag.name) + ')',
                backgroundColor: 'rgb(' + transBackGroundColor(tag.name) + ')'
              }">{{ tag.name }}</span>

              <div class="tag" :style="{
                color: 'rgb(' + transFontColor(item.status) + ')',
                backgroundColor: 'rgb(' + transBackGroundColor(item.status) + ')'
              }">
                {{ transStatus(item.status) }}
              </div>
              
              <div class="tag" :style="{
                color: 'rgb(' + transFontColor(item.visibility) + ')',
                backgroundColor: 'rgb(' + transBackGroundColor(item.visibility) + ')'
              }">
                {{ transVisibility(item.visibility) }}
              </div>
            </div>

            <div class="engage-show">
              <div class="tag-bottom"><van-icon name="eye" />{{ item.stats.viewCnt }}</div>
              <div class="tag-bottom"><van-icon name="comment-o" />{{ item.stats.orderCnt }}</div>
              <div class="tag-bottom">{{ timeAgo(item.createdAt) }}创建</div>
              <div class="tag-bottom">编辑于{{ timeAgo(item.expireAt) }}</div>
            </div>

            <div class="actions" :style="{ opacity: isManaging ? 1 : 0 }">
                        <!-- <button class="" @click.stop="deleteArticle(item.id,$event)">评价任务</button> -->
                        <!-- 只有进行中显示完成任务按钮 -->
                        <button class="btn" v-show="item.status==='RUNNING'"  @click.stop="finish(item.id,$event)">完成任务</button>
                        <!-- 只有进行中和审核中显示取消任务按钮 -->
                        <button class="btn" v-show="item.status==='RUNNING'||item.status==='AUDITING'"  @click.stop="cancel(item.id,$event)">取消任务</button>
            </div>
          </div>

          <div class="no-task" v-show="form.length === 0 && !loading">
            <van-icon name="warning-o" />
            <div>您还没有接收任务</div>
          </div>
        </van-list>
      </van-pull-refresh>
    </van-tab>
  </div>
</template>

<style scoped>
.btn
{
  border-radius: 10px;
  width: 50px;
  height: 40px;
  font-size: 10px;
  border:2px;
  margin-right: 20px;
  text-align: center;
}
.btn
{

        border:none;
        padding: 8px 14px; /* 按钮内边距 */
        z-index: 1;
        /* 移除按钮自身的绝对定位，让它们受 .actions 容器管理 */
        /* position: absolute;  <-- 已删除 */
        /* z-index: 50;        <-- 已删除 */
        
        background: rgba(255, 255, 255, 0.5); /* 稍微提高背景不透明度，效果更好 */
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: rgba(50,50,50,0.8);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 
        0 4px 15px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.btn:hover
{
      transform: translateY(-15%); /* 鼠标悬浮时轻微上浮 */
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      background-color: rgba(89, 241, 109,0.5);
}
 .actions
    {
      
      /* 1. 使用绝对定位，使其脱离文档流 */
      position: absolute;
      /* 2. 将其定位在 .article 的右上角 */
      top: 50%;
      right: 20px;
      transform: translateY(-50%); /* 垂直居中对齐 */
      /* 3. 使用 flex 布局让按钮垂直排列 */
      display: flex;
      flex-direction: column;
      gap: 10%; /* 按钮之间的间距 */
      transition: all .3s;
      
      opacity: 1;
      opacity: 0;
      width:50%;
      height:100%;
      justify-content: center;
      align-items:end;
    }

.title {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
}

.nickname {
  font-size: 6px;
  margin-left: 3px;
  color: rgb(95, 95, 95);
}

.reward {
  font-size: 10px;
  color: red;
  margin-right: 5%;
}

.message-show {
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.content {
  font-size: 10px;
}

.tag-bottom {
  padding: 4px 2px;
  border-radius: 1px;
  font-size: 6px;
  color: rgb(73, 73, 73)
}

.profile {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  background-color: antiquewhite;
}

.no-task {
  position: fixed;
  inset: 0;
  margin: auto;
  width: max-content;
  height: max-content;
  color: rgb(156, 156, 156);
  text-align: center;
  font-size: 10px;
}

.tabs {
  --van-tabs-line-height: 20px;
  --van-tab-font-size: 10px;
  --van-tab-line-height: 15px;
}

.main {
  display: grid;
  grid-template-columns: auto;
}

.article {
  position: relative;
  margin-left: 5%;
  width: 90%;
  background-color: rgb(250, 250, 250);
  margin-top: 3%;
  border-radius: 20px;
  transition: all .3s;
  opacity: 1;
  padding-left: 20px;
  box-shadow: 10px 8px 30px rgba(0, 0, 0, 0.2);
  display: grid;
  grid-template-columns: 1fr;
  gap: 3px;
}

.article:hover {
  transform: scale(1.05, 1.05);
  box-shadow: 20px 16px 60px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 20;
  opacity: 0.9;
}

.tag-show, .engage-show {
  display: flex;
  flex-wrap: wrap;
  gap: 3%;
}

.tag-show {
  margin: 0 5px 0px 3px;
  justify-content: left;
}

.engage-show {
  justify-content: left;
  margin: 0 3px 1px 0px;
}

.tag {
  padding: 1px 2px;
  background-color: rgb(225, 224, 224);
  border-radius: 3px;
  font-size: 5px;
  color: rgb(73, 73, 73)
}
</style>