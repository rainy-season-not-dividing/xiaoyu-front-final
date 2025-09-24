<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { timeAgo } from '@/utils/timeFormat'
import { transVisibility, transStatus, transFontColor, transBackGroundColor } from '@/utils/translate'
import { getMyTaskList } from '@/api/task'
import { acceptTaskOrder, rejectTaskOrder, confirmTaskOrder } from '@/api/task'


//按钮逻辑
//按钮按下后的逻辑
//分页刷新逻辑



const router = useRouter()

const props = defineProps({
  isManaging: {
    type: Boolean,
    default: false
  },
  checkbox_temp:
  {
    type: Array,
    default: ""
  }
})

watch(
  () => props.checkbox_temp,
  (newVal, oldVal) => {
    console.log("watch触发")
    console.log('checkbox_temp changed:', newVal)
    // 重置分页和状态
    currentPage.value = 1
    loading.value = false
    finished.value = false
    refreshing.value = false

    // 重新获取数据
    fetchTaskList()
  },
  { deep: true } // 深度监听数组内部变化
)


// 响应式数据

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const Id_operating = ref(0)


const form = ref([])

const showconfirm = ref(false)


//正式
// 获取任务列表
const fetchTaskList = async () => {
  try {
    // 测试1
    console.log('获取任务列表:', props.checkbox_temp)
    const { data: { data } } = await getMyTaskList({
      page: currentPage.value,
      size: pageSize.value,
      status: props.checkbox_temp ? props.checkbox_temp : '',
      // 可以添加其他筛选参数
      // tag_id: '',
      // status: '',
      // keyword: ''   
    })


    //测试2
    //    let statusParam = '';
    // if (props.checkbox_temp && props.checkbox_temp.length > 0) {
    //   statusParam = props.checkbox_temp.join(',');
    // }

    // const { data: { data } } = await getMyTaskList({
    //   page: currentPage.value,
    //   size: pageSize.value,
    //   status: statusParam,
    // })


    if (currentPage.value === 1) {
      form.value = data.list
      refreshing.value = false

    } else {
      form.value = [...form.value, ...data.list]
    }

    if (!refreshing.value) {

      ++currentPage.value
    }

    loading.value = false

    // 判断是否还有更多数据
    if (form.value.length >= data.pagination.total) {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    finished.value = true
  } finally {
    loading.value = false
    refreshing.value = false  // 添加这一行
  }
}

// 加载更多
const onLoad = async () => {
  if (refreshing.value) {
    refreshing.value = false
    currentPage.value = 1
  }
  if (finished.value) {
    await fetchTaskList()
  }
  loading.value = false
}

// 下拉刷新
const onRefresh = async () => {
  console.log('下拉刷新')
  refreshing.value = true
  finished.value = false
  currentPage.value = 1
  await fetchTaskList()
}

// 初始化加载

onMounted(async () => {
  await fetchTaskList()
})

const goDetail = (id) => {
  console.log("准备进入任务详情页")
  router.push(`/task/publish/${id}`);
}
//接收任务
//拒绝任务
//确认任务完成



const finish = async (id, event, status) => {
  // 处理删除或评价任务逻辑
  if (status == 'AUDITING') {
    Id_operating.value = id
    showconfirm.value = !showconfirm.value

  }
  else {
    console.log('处理任务:', id)
    await finishTaskOrder(id);
  }

}
const refuse = async (id, event) => {
  //拒绝任务请求
  console.log('拒绝任务:', id)
  await rejectTaskOrder(id);
}
const accept = async (id, event) => {
  //接受任务请求

  console.log('接受任务:', id)
  await acceptTaskOrder(id);

}

//审核状态下拒绝并完成任务
const Confirm = async (event) => {
  //处理通过任务逻辑
  console.log('通过任务:')
  await refuse(Id_operating.value, event)
  await finish(Id_operating.value, event)
  showconfirm.value = !showconfirm.value
}
//审核状态下关掉模态框
const Cancel = async (id, event) => {
  //处理通过任务逻辑
  console.log('取消完成任务:', id)
  showconfirm.value = !showconfirm.value
}


// const rate=(id)=>{ 
//   console.log('准备进入评价页')
//   router.push(`/rate`);
// }


//筛选逻辑下的页面
//  'RUNNING': '进行中',
//     'FINISH': '已完成',//任务正常结束
//     'CLOSED': '已关闭',//关闭任务
//     'RECRUIT': '招募中',
//     'AUDITING': '审核中',
//     'ARBITRATED': '审核未通过',
const tags = ref(
  {
    'RUNNING': false,
    'FINISH': false,
    'CLOSED': false,
    'RECRUIT': false,
    'AUDITING': false,
    'ARBITRATED': false
  })






</script>



<template>
  <div data-v-inspector="src/components/TaskSendList.vue:235:3">
    <div class="modal" v-show="showconfirm" data-v-inspector="src/components/TaskSendList.vue:236:5">
      <div class="modal-content" data-v-inspector="src/components/TaskSendList.vue:237:7">
        <h2 class="title-sort" data-v-inspector="src/components/TaskSendList.vue:238:9">当前有用户请求接受任务，确定拒绝并完成该任务吗</h2>
        <div class="yes-no" data-v-inspector="src/components/TaskSendList.vue:239:9">
          <input type="button" value="确定" class="yes" @click="Confirm"
            data-v-inspector="src/components/TaskSendList.vue:240:11">
          <input type="button" value="取消" class="yes" @click="Cancel"
            data-v-inspector="src/components/TaskSendList.vue:241:11">
        </div>

      </div>
    </div>
    <div class="main" data-v-inspector="src/components/TaskSendList.vue:246:5">
      <!--结束任务-->
      <!--接收拒绝任务-->
      <van-tab title="我发布的" data-v-inspector="src/components/TaskSendList.vue:249:7">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh"
          data-v-inspector="src/components/TaskSendList.vue:250:9">
          <van-list  v-model:loading="loading" :finished="finished" finished-text="没有更多了" 
            @load="onLoad" data-v-inspector="src/components/TaskSendList.vue:251:11" >
            <div class="article-background">
  <div class="article" v-for="item in form" :key="item.id" @click="goDetail(item.id)"
                data-v-inspector="src/components/TaskSendList.vue:252:13">

                <div class="title" style="margin-top: 2%;" data-v-inspector="src/components/TaskSendList.vue:254:15">
                  <span style="font-weight: 600;" data-v-inspector="src/components/TaskSendList.vue:255:17">{{ item.title
                    }}</span>
                  <span class="reward" data-v-inspector="src/components/TaskSendList.vue:256:17">￥{{ item.reward }}</span>
                </div>

                <div class="content" data-v-inspector="src/components/TaskSendList.vue:259:15">
                  <p data-v-inspector="src/components/TaskSendList.vue:260:17">{{ item.content }}</p>
                </div>

                <div class="tag-show" data-v-inspector="src/components/TaskSendList.vue:263:15">

                  <span v-for="tag in item.tags" :key="tag.id" class="tag" :style="{
                    color: 'rgb(' + transFontColor(tag.name) + ')',
                    backgroundColor: 'rgb(' + transBackGroundColor(tag.name) + ')'
                  }" data-v-inspector="src/components/TaskSendList.vue:265:17">{{ tag.name }} </span>


                  <div class="tag" :style="{
                    color: 'rgb(' + transFontColor(item.status == 'ARBITRATED' ? 'RECRUIT' : item.status) + ')',
                    backgroundColor: 'rgb(' + transBackGroundColor(item.status == 'ARBITRATED' ? 'RECRUIT' : item.status) + ')'
                  }" data-v-inspector="src/components/TaskSendList.vue:271:17">
                    {{ transStatus(item.status == 'ARBITRATED' ? 'RECRUIT' : item.status) }}
                  </div>

                  <div class="tag" :style="{
                    color: 'rgb(' + transFontColor(item.visibility) + ')',
                    backgroundColor: 'rgb(' + transBackGroundColor(item.visibility) + ')'
                  }" data-v-inspector="src/components/TaskSendList.vue:278:17">
                    {{ transVisibility(item.visibility) }}
                  </div>

                </div>

                <div class="engage-show" data-v-inspector="src/components/TaskSendList.vue:287:15">
                  <div class="tag-bottom" data-v-inspector="src/components/TaskSendList.vue:288:17"><van-icon name="eye"
                      data-v-inspector="src/components/TaskSendList.vue:288:41" />{{ item.stats.viewCnt }}</div>
                  <div class="tag-bottom" data-v-inspector="src/components/TaskSendList.vue:289:17"><van-icon
                      name="comment-o" data-v-inspector="src/components/TaskSendList.vue:289:41" />{{ item.stats.orderCnt
                    }}</div>
                  <!-- <div class="tag-bottom">{{timeAgo(item.createdAt) }}创建</div> -->
                  <div class="tag-bottom" data-v-inspector="src/components/TaskSendList.vue:291:17">编辑于{{
                    timeAgo(item.expireAt) }}</div>

                </div>

                
              </div>
            </div>
            
            
            <div class="no-task" v-show="!form" data-v-inspector="src/components/TaskSendList.vue:310:13">

              <van-icon name="warning-o" data-v-inspector="src/components/TaskSendList.vue:312:15" />
              <div data-v-inspector="src/components/TaskSendList.vue:313:15">您还没有发布任务</div>
            </div>
          </van-list>
        </van-pull-refresh>
      </van-tab>
    </div>
  </div>
</template>


<style scoped>
.article-background {
  height: 100vh;
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
  border-radius: 10px;
  width: 100px;
  height: 20px;
  font-size: 10px;
  border: 2px;
  margin-right: 10px;
  text-align: center;
}

.btn {

  border: none;
  padding: 0px 14px;
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

.btn:hover {
  transform: translateY(-15%);
  /* 鼠标悬浮时轻微上浮 */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  background-color: rgba(89, 241, 109, 0.5);
}

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
  align-items: end;
}

.title {
  display: flex;
  justify-content: space-between;
  font-size: 15px;

}

.nickname {
  font-size: 10px;
}

.reward {
  font-size: 10px;
  color: red;
  margin-right: 5%;
}

.message-show {
  display: flex;
  align-items: center;
}

.message-show * {
  margin-left: 30px;
}

.content {
  font-size: 15px;

}

.tag-bottom {
  padding: 4px 2px;
  border-radius: 1px;
  font-size: 12px;
  color: rgb(73, 73, 73)
}

.profile {
  width: 8%;

}

.no-task {
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
  text-align: center;
  font-size: 10px;
}

/* 标签切换栏*/
.tabs {
  /* 调整标签栏高度以适应大字体 */
  --van-tabs-line-height: 20px;
  /* 增加高度 */
  /* 设置字体大小 */
  --van-tab-font-size: 10px;
  /* 行高也要相应调整 */
  --van-tab-line-height: 15px;
}

/*文章主体 */
.main {
  display: grid;
  grid-template-columns: auto;
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

  padding-left: 20px;
  /* 给文章文字留点空间 */
  box-shadow: 10px 8px 30px rgba(0, 0, 0, 0.2);
  /* 优化阴影 */

  display: grid;
  grid-template-columns: 1fr;
  gap: 3px;
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

/* 标签及互动展示*/
.tag-show,
.engage-show {
  display: flex;
  flex-wrap: wrap;
  gap: 3%;
  /* background-color: aqua;*/
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
  font-size: 10px;
  color: rgb(73, 73, 73)
}
</style>
