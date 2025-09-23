// 处理输入框获得焦点
export const handleInputFocus = (commentInput) => {
    // 确保输入框获得焦点
    if (commentInput.value) {
        commentInput.value.focus()

        // 将输入框往上顶
        scrollToInput()
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