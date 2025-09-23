
// 'RUNNING': '进行中',
// 'FINISH': '已完成',
// 'RECRUIT': '招募中',


// 'CLOSED': '已关闭',
// 'AUDITING': '审核中',
// 'ARBITRATED': '审核未通过'

//    { text: '所有人可见', value: 'PUBLIC' },
//    { text: '仅好友可见', value: 'FRIEND' },
//    { text: '同校区可见', value: 'CAMPUS' }



const statusList=
{
    'RUNNING': '进行中',
    'FINISH': '已完成',//任务正常结束
    'CLOSED': '已关闭',//关闭任务
    'RECRUIT': '招募中',
    'AUDITING': '审核中',
    'ARBITRATED': '审核未通过',

    //下面的没用
    'DRAFT': '草稿',
    'DELIVER': '交付中',


// | 状态值        | 中文含义（简洁） | 中文含义（口语）       |
// | ---------- | -------- | -------------- |
// | DRAFT      | 草稿       | 还没发布，仅自己可见     |
// | AUDITING   | 审核中      | 已提交，等平台/运营通过   |
// | RECRUIT    | 招募中      | 已发布，正在找人接单     |
// | RUNNING    | 进行中      | 有人接了，正在干活      |
// | DELIVER    | 已交付      | 干活的人交了成果，待确认   |
// | FINISH     | 已完成      | 双方都搞定，交易结束     |
// | CLOSED     | 已关闭      | 中途取消或过期，提前结束   |
// | ARBITRATED | 已仲裁      | 出现纠纷，平台介入并给出裁定 |
}
const visibilityList=
{
    'PUBLIC': '所有人可见',
    'FRIEND': '仅好友可见',
    'CAMPUS': '同校区可见',
}
const colors = {
    //0是字体颜色，1是背景颜色
    'DRAFT': ["149, 165, 166", "240, 243, 245"],      // 灰色系，表示草稿
    'DELIVER': ["250, 165, 71","255, 247, 230"],      // 橙色系，表示交付中
    'RUNNING': ["250, 165, 71","255, 247, 230"],
    'FRIEND': ["52, 158, 255","230, 247, 255"],
    'CAMPUS': ["52, 158, 255","230, 247, 255"],
    'FINISH': ["46, 204, 113", "236, 255, 242"],      // 绿色系，表示完成
    'CLOSED': ["149, 165, 166", "240, 243, 245"],     // 灰色系，表示关闭
    'RECRUIT': ["52, 158, 255","230, 247, 255"],
    'PUBLIC': ["52, 158, 255","230, 247, 255"],
    'AUDITING': ["155, 89, 182", "247, 230, 255"],    // 紫色系，表示审核中
    'ARBITRATED': ["231, 76, 60", "255, 230, 255"]    // 红色系，表示审核未通过
}
export const transVisibility=(visibility)=>
    {
        if(visibility in visibilityList)
        {
            return visibilityList[visibility]
        }
        else
        {
            return "未知"
        }
    }
export const transStatus=(status)=>
    {
        if(status in statusList)
        {
            return statusList[status]
        }
        else
        {
            return "未知状态"
        }
    }

    export const transFontColor=(str)=>
    {
        if(str in colors)
        {
            return colors[str][0]
        }
        else
        {
            return "150, 179, 255"
        }
    }
export const transBackGroundColor=(str)=>
    {
        if(str in colors)
        {
            return colors[str][1]
        }
        else
        {
            return "236, 242, 255"
        }
    }