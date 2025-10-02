<!-- NotFound.vue -->
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
    <div class="not-found-page">
        <div class="nature-scene">
            <div class="mountain-back"></div>
            <div class="mountain-middle"></div>
            <div class="mountain-front"></div>

            <div class="content-overlay">
                <div class="content-card">
                    <h1 class="error-code">404</h1>
                    <h2>页面走丢了，回家吧...</h2>
                    <button class="back-button" @click="router.replace('/')">回家</button>
                </div>
            </div>

            <div class="cloud cloud-1" />
            <div class="cloud cloud-2" />
            <div class="cloud cloud-3" />

            <div class="sun" />

            <div class="bird bird-1" />
            <div class="bird bird-2" />
            <div class="bird bird-3" />
        </div>
    </div>
</template>

<style lang="less" scoped>
.not-found-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #e6f7ff, #b3e0ff);
    color: #2c5a73;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
    position: relative;
}

.nature-scene {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.mountain-back {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40%;
    background: linear-gradient(to top, #a8d8ea, #8bb9d4);
    // 定义了元素的可见区域 只有在裁剪路径内的内容才会显示，路径外的内容被隐藏
    /* 0% 100% - 左下角起点
       20% 60% - 第一个山峰点
       40% 80% - 山谷点
       60% 40% - 第二个山峰点
       80% 70% - 山谷点
       100% 30% - 最后一个山峰点
       100% 100% - 右下角终点，回到底部 */
    clip-path: polygon(0% 100%, 20% 60%, 40% 80%, 60% 40%, 80% 70%, 100% 30%, 100% 100%);
}

.mountain-middle {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 45%;
    background: linear-gradient(to top, #7fbcd2, #6aa8c2);
    clip-path: polygon(0% 100%, 15% 70%, 35% 85%, 55% 50%, 75% 75%, 100% 40%, 100% 100%);
}

.mountain-front {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: linear-gradient(to top, #5fa8c2, #4a95b0);
    clip-path: polygon(0% 100%, 10% 80%, 30% 90%, 50% 60%, 70% 85%, 90% 65%, 100% 90%, 100% 100%);
}

.sun {
    position: absolute;
    top: 20%;
    right: 15%;
    width: 80px;
    height: 80px;
    background: #ffd166;
    border-radius: 50%;
    box-shadow: 0 0 40px #ffd166;
    animation: pulse 3s infinite;
}

.cloud {
    position: absolute;
    background: white;
    border-radius: 50%;
    // 高斯模糊
    filter: blur(2px);
    z-index: 2;
}

.cloud-1 {
    top: 25%;
    left: 15%;
    width: 60px;
    height: 25px;
    animation: float 15s infinite linear;
}

.cloud-1::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 5px;
    width: 30px;
    height: 30px;
    background: white;
    border-radius: 50%;
}

.cloud-1::after {
    content: '';
    position: absolute;
    top: -5px;
    right: 10px;
    width: 25px;
    height: 25px;
    background: white;
    border-radius: 50%;
}

.cloud-2 {
    top: 40%;
    left: 30%;
    width: 80px;
    height: 30px;
    animation: float 20s infinite linear 2s;
}

.cloud-2::before {
    content: '';
    position: absolute;
    top: -15px;
    left: 10px;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
}

.cloud-2::after {
    content: '';
    position: absolute;
    top: -8px;
    right: 15px;
    width: 35px;
    height: 35px;
    background: white;
    border-radius: 50%;
}

.cloud-3 {
    top: 15%;
    right: 30%;
    width: 70px;
    height: 25px;
    animation: float 18s infinite linear 1s;
}

.cloud-3::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 8px;
    width: 35px;
    height: 35px;
    background: white;
    border-radius: 50%;
}

.cloud-3::after {
    content: '';
    position: absolute;
    top: -6px;
    right: 12px;
    width: 30px;
    height: 30px;
    background: white;
    border-radius: 50%;
}

.bird {
    position: absolute;
    background: #2c5a73;
    border-radius: 50% 50% 0 50%;
    transform: rotate(-45deg);
    animation: fly-bird 20s infinite linear;
    z-index: 3;
}

.bird-1 {
    top: 30%;
    left: -20px;
    width: 15px;
    height: 15px;
    animation-delay: 0s;
}

.bird-2 {
    top: 35%;
    left: -20px;
    width: 15px;
    height: 15px;
    animation-delay: 5s;
}

.bird-3 {
    top: 25%;
    left: -20px;
    width: 15px;
    height: 15px;
    animation-delay: 10s;
}

.content-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 4;
    pointer-events: none;
}

.content-card {
    text-align: center;
    padding: 30px;
    background: rgba(255, 255, 255, .1);
    border-radius: 20px;
    // 模糊后面
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
    max-width: 90%;
    pointer-events: auto;
    animation: fadeIn 1s ease-out;
    width: 500px;
}

.error-code {
    font-size: 60px;
    margin: 0;
    color: #2c5a73;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.content-card h2 {
    font-size: 25px;
    margin: 16px 0;
    color: #2c5a73;
}

.back-button {
    margin-top: 20px;
    background: linear-gradient(45deg, #4cc9f0, #4361ee);
    border: none;
    color: white;
    width: 120px;
    height: 40px;
    line-height: 30px;
    font-size: 16px;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(67, 97, 238, 0.3);
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

@keyframes float {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(2000px);
    }
}

@keyframes fly-bird {
    0% {
        transform: translateX(0) rotate(-45deg);
    }

    100% {
        transform: translateX(2000px) rotate(-45deg);
    }
}

@keyframes fadeIn {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>