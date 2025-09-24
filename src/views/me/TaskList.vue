<script setup>
    import { ref,onMounted } from 'vue'
    //获取用户任务，分为我发布的，我接受的
    import { useRouter } from 'vue-router'
    
    import TaskSendList from '../../components/TaskSendList.vue'
    import TaskReceiveList from '../../components/TaskReceiveList.vue'

    const router = useRouter()
    const active = ref(0);
    const managing = ref(false);
    const showconfirm = ref(false);
    const onClickLeft = () => router.back();
    const onClickRight = () => {
      managing.value = !managing.value
    };
    const checkedStatus = ref("")

    const checkedStatus_temp = ref("")

    //点击筛选的时候将checkedStatus_temp赋值给checkedStatus
    //选的时候改的是checkedStatus,实际传递给组件的是checkedStatus_temp
    //保持两者同步
    //若取消，则将checkedStatus_temp赋值给checkedStatus
    //若确定，将checkedStatus赋值给checkedStatus_temp



    // 确定按钮处理函数
    const Confirm = () => {
      // 处理筛选逻辑
      console.log('选中的状态:', checkedStatus.value)
      checkedStatus_temp.value = checkedStatus.value
      console.log('checkedStatus_temp.value:', checkedStatus_temp.value)
      showconfirm.value = !showconfirm.value
      // 这里可以添加实际的筛选逻辑
    }
    //取消按钮处理函数
    const Cancel=()=>
    {
      showconfirm.value=!showconfirm.value
      checkedStatus.value=checkedStatus_temp.value
    }


</script>

<template>
  <div class="filter-section" v-if="managing&&active===0">
    <van-button icon="filter-o" type="default" size="small" @click="showconfirm = true" class="filter-button">
      筛选
    </van-button>
  </div>
  <van-sticky class="sticky-component">
    <van-nav-bar title="任务中心" left-text="" left-arrow :right-text="managing ? '取消' : '管理'" @click-left="onClickLeft"
      @click-right="onClickRight" class="custom-nav-bar" />
  </van-sticky>
  <van-tabs v-model:active="active" class="tabs">
    <keep-alive>
      <TaskSendList :isManaging="managing" :checkbox_temp="checkedStatus_temp"></TaskSendList>
    </keep-alive>
    <keep-alive>
      <TaskReceiveList :isManaging="managing"></TaskReceiveList>
    </keep-alive>


  </van-tabs>
  <div class="modal" v-show="showconfirm">
    <div class="modal-content">
      <h2 class="title-sort">筛选条件</h2>
      <div class="content-sort">
        <van-radio-group v-model="checkedStatus" ref="radioGroup">
          <van-radio name="RUNNING" shape="round" class="sort-option">进行中</van-radio>
          <van-radio name="FINISH" shape="round" class="sort-option">已完成</van-radio>
          <!-- <van-radio name="CLOSED" shape="round" class="sort-option">已关闭</van-radio> -->
          <van-radio name="RECRUIT" shape="round" class="sort-option">招募中</van-radio>
          <van-radio name="AUDITING" shape="round" class="sort-option">审核中</van-radio>
          <van-radio name="ARBITRATED" shape="round" class="sort-option">审核未通过</van-radio>
        </van-radio-group>
      </div>
      <div class="yes-no">
        <input type="button" value="确定" class="yes" @click="Confirm">
        <input type="button" value="取消" class="no" @click="Cancel">
      </div>

    </div>
  </div>


</template>
<style>
.sort-option
{
   margin-top: 7px;
}
.yes-no
{
  display: flex;
  justify-content: center;
  gap:30px;
}
.yes,.no{
        position: relative;
        border-radius: 2vw;
        border:none;
        padding: 10px 14px; /* 按钮内边距 */
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
.content-sort {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.content-sort :deep(.van-checkbox) {
  margin-bottom: 10px;
}

.content-sort :deep(.van-checkbox__label) {
  font-size: 16px;
  color: #333;
}
.title-sort
{
  margin-left: 20px;
}
.modal {

    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    overflow-y: auto;
}
.modal-content{
  position: fixed;
  inset: 0;                 /* top:0 right:0 bottom:0 left:0 */
  margin: auto;             /* 关键：自动把剩余空间均分给四边 */
  width: max-content;       /* 或具体值，如 200px */
  height: max-content;      /* 或具体值，如 60px */
  border-radius: 5vw;
  height: 400px;
  width: 300px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  

  display: flex;
  flex-direction: column;



}

</style>

