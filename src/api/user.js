import request from "@/utils/request"

// 获取当前用户信息
export const getUserInfo = () => {
    return request.get('/api/users/me')
}

// 登录
export const login = ({ account, password }) => {
    return request.post('/api/auth/password/login', {
        account,
        password
    })
}

// 注册
export const register = (account, password) => {
    return request.post('/api/auth/register', {
        account,
        password
    })
}

// 退出登录
export const logout = () => {
    return request.post('/api/auth/logout')
}

// 更新用户信息
export const updateUerInfo = (fd) => {
    return request.put('/api/users/profile', fd)
}

// 拉黑用户
export const addBlack = (targetId) => {
    return request.post('/api/users/blacklist', {
        targetId
    })
}

// 获取黑名单列表
export const getBlackList = (page, size) => {
    return request.get('/api/users/blacklist', {
        params: {
            page,
            size
        }
    })
}

// 去除黑名单
export const delBlack = (target_id) => {
    return request.delete(`/api/users/blacklist/${target_id}`)
}

// 获取用户信息
export const getUserDetail = (user_id) => {
    return request.get(`/api/users/${user_id}`)
}

// 查询用户
export const searchUser = (keyword, page, size) => {
    return request.get('/api/search/users', {
        params: {
            keyword,
            page,
            size
        }
    })
}

// 获取随机用户账号
export const getUserAccount = () => {
    return request.get('/api/auth/generate-account')
}

//获取我的收藏
export const getSelfAllCollection = () => {
    ///posts/favorite
    return request.get(`/api/posts/favorite`)
}

//获取喜欢的动态
export const getSelfAllLisk= () => {
    ///posts/favorite
    return request.get(`/api/posts/like`)
}    