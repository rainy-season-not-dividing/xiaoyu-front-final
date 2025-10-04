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

// 发送好友申请
export const sendFriendApply = (friendId, message) => {
    return request.post(`/api/friends/request`, {
        friendId,
        message
    })
}

// 接受好友申请
export const acceptFriend = (friendId) => {
    return request.put(`/api/friends/${friendId}/accept`)
}

// 拒绝好友申请
export const rejectFriend = (friendId) => {
    return request.put(`/api/friends/${friendId}/refuse`)
}

// 删除好友
export const deleteFriend = (friendId) => {
    return request.delete(`/api/friends/${friendId}`)
}