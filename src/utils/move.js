import { nextTick } from 'vue'

// 处理输入框获得焦点
export const handleInputFocus = (commentInput) => {
    // 确保输入框获得焦点
    if (commentInput.value) {
        commentInput.value.focus()

        // 将输入框往上顶
        scrollToInput(commentInput)
    }
}

// 处理输入框失去焦点
export const handleInputBlur = () => {
    // 可以在这里添加额外的逻辑
}

// 将输入框往上顶的函数
export const scrollToInput = (commentInput) => {
    // 获取当前页面的滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // 获取输入框的位置
    const inputRect = commentInput.value.getBoundingClientRect()
    const inputTop = inputRect.top + scrollTop

    // 计算需要滚动的距离
    const viewportHeight = window.innerHeight
    const scrollDistance = inputTop - (viewportHeight * 0.8) // 调整偏移量

    // 平滑滚动到输入框位置
    window.scrollTo({
        top: scrollDistance,
        behavior: 'smooth'
    })
}

// scrollToBottom 函数 - 使用更精确的选择器和多重尝试
export const scrollToBottom = (selectors) => {
    nextTick(() => {
        setTimeout(() => {
            // 尝试多个可能的滚动容器
            for (let selector of selectors) {
                const element = document.querySelector(selector)
                if (element && element.scrollHeight > 0) {
                    element.scrollTop = element.scrollHeight
                    break
                }
            }

            // 如果上面的方法都不行，尝试直接滚动整个页面
            if (document.body.scrollHeight > window.innerHeight) {
                window.scrollTo(0, document.body.scrollHeight)
            }
        }, 100)
    })
}

// 判断是否在底部的函数
export const isScrolledToBottom = (containers) => {
    // 尝试多个可能的滚动容器

    for (let container of containers) {
        if (container) {
            // 对于不同的容器类型使用不同的属性
            let scrollTop, scrollHeight, clientHeight

            if (container === document.documentElement || container === document.body) {
                // document 或 body 的滚动
                scrollTop = window.pageYOffset || document.documentElement.scrollTop
                scrollHeight = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.offsetHeight,
                    document.body.clientHeight,
                    document.documentElement.clientHeight
                )
                clientHeight = window.innerHeight || document.documentElement.clientHeight
            } else {
                // 普通元素的滚动
                scrollTop = container.scrollTop
                scrollHeight = container.scrollHeight
                clientHeight = container.clientHeight
            }

            // 检查是否在底部（允许30px误差）
            if (scrollHeight > clientHeight) { // 确保有滚动条
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30
                return isAtBottom
            }
        }
    }

    // 默认返回 true（假设在底部）
    return true
}