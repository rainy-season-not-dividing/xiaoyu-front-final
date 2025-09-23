import request from "@/utils/request";

// 获取好友列表
export const getFriendsList = ({ page, size, status }) => {
    return request.get('/api/friends', {
        params: {
            page,
            size,
            status
        }
    })
}

// 获取聊天记录
export const getChatRecord = ({ page, size, friendId }) => {
    return request.get('/api/friends/messages', {
        params: {
            page,
            size,
            friendId
        }
    })
}