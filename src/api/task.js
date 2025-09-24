import request from "@/utils/request";

// 获取所有任务标签
export const getAllTaskTag = () => {
    return request.get('/api/tags')
}

// 获取任务列表
export const getTaskList = ({ page, size, tag_id, status, keyword }) => {
    return request.get('/api/tasks', {
        params: {
            page,
            size,
            tag_id,
            status,
            keyword
        }
    })
}

// 获取我发布的任务列表
export const getMyTaskList = ({ page, size, tag_id, status, keyword }) => {
    return request.get('/api/tasks/my-published', {
        params: {
            page,
            size,
            tag_id,
            status,
            keyword
        }
    })
}

// 领取任务
export const takeTask = (task_id) => {
    return request.post(`/api/task_orders/${task_id}`)
}

// 发布任务
export const publishTask = ({title,content,reward,visibility,expireAt,tagIds,files}) => {
    return request.post('/api/tasks', {
        title,
        content,
        reward,
        visibility,
        expireAt,
        tagIds,
        files
    })
}

// 编辑任务
export const editTask = (task_id, {title,content,reward,visibility,expireAt,tagIds,files}) => {
    return request.put(`/api/tasks/${task_id}`,{
        title,
        content,
        reward,
        visibility,
        expireAt,
        tagIds,
        files
    })
}

// 获取任务详情
export const getTaskDetail = (task_id) => {
    return request.get(`/api/tasks/${task_id}`)
}

// 提交任务评价
export const submitTaskComment = (taskId, orderId, revieweeId, roleType, score, tags, content) => {
    return request.post('/api/task_orders/reviews', {
        taskId,
        orderId,
        revieweeId,
        roleType,
        score,
        tags,
        content
    })
}

// 接取任务
export const acceptTask = (task_id) => {
    return request.post(`/api/task_orders/${task_id}`)
}


//111获取我接收的任务
export const getMyReceiveTaskList = () => {
    return request.get('/api/tasks/my-received')
}

//发布者：
//111接受任务订单     `PUT /api/task_orders/{order_id}/accept`
export const acceptTaskOrder = (task_id) => {
    return request.put(`/api/task_orders/${task_id}/accept`)
}
//111拒绝任务订单     PUT /api/task_orders/{order_id}/refuse`
export const rejectTaskOrder = (task_id) => {
    return request.put(`/api/task_orders/${task_id}/refuse`)
}
//111确认任务完成     PUT /api/task_orders/{order_id}/confirm-finish
export const confirmTaskOrder = (task_id) => {
    return request.put(`/api/task_orders/${task_id}/confirm-finish`)
}


//接收者:
//111取消任务订单    PUT /api/task_orders/{order_id}/cancel
export const cancelTaskOrder = (task_id) => {
    return request.put(`/api/task_orders/${task_id}/cancel`)
}

//111完成任务    PUT /api/task_orders/{order_id}/finish`
export const finishTaskOrder = (task_id) => {
    return request.put(`/api/task_orders/${task_id}/finish`)
}