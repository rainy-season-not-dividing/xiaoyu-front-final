import request from "@/utils/request"

// 上传文件
export const uploadFile = (fd) => {
    return request.post('/api/files/upload', fd,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}