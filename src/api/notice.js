import request from "@/utils/request"

// 获取通知列表
export const getNoticeList = (type, page, size) => {
    return request.get('/api/notifications', {
        params: {
            type,
            page,
            size
        }
    })
}

// 已读通知
export const readNotice = (notification_id) => {
    return request.put(`/api/notifications/${notification_id}/read`)
}