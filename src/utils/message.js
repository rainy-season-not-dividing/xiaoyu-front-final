import { createVNode, render } from 'vue'
import MessageDialog from '@/components/MessageDialog.vue'

let seed = 0

// 消息弹窗
export const showMessage = (options) => {
    const id = `message_dialog_${seed++}`
    const userOnClick = options.onClick

    // 默认配置
    options = {
        visible: true,
        ...options
    }

    // 创建容器
    let container = document.createElement('div')
    container.id = id

    // 点击回调
    const clickCallback = () => {
        // 销毁虚拟节点 null是销毁
        render(null, container)
        document.body.removeChild(container)
        if (userOnClick) {
            userOnClick()
        }
    }

    options.onClick = clickCallback

    // 创建虚拟节点并渲染
    const vnode = createVNode(MessageDialog, options)

    // 渲染虚拟节点 挂载
    render(vnode, container)
    document.body.appendChild(container)
}