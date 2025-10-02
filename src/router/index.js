import { createRouter, createWebHistory } from 'vue-router'
import LoginIndex from '@/views/login/LoginIndex.vue'
import LayoutIndex from '@/views/layout/LayoutIndex.vue'
import PostIndex from '@/views/post/PostIndex.vue'
import { useUserStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 登录
      path: '/login',
      component: LoginIndex
    },
    {
      // 首页架子
      path: '/',
      component: LayoutIndex,
      redirect: '/posts',
      children: [
        {
          // 朋友圈
          path: '/posts',
          component: PostIndex
        },
        {
          // 任务
          path: '/task',
          component: () => import('@/views/task/TaskIndex.vue')
        },
        {
          // 消息
          path: '/message',
          component: () => import('@/views/message/MessageIndex.vue')
        },
        {
          // 我的
          path: '/me',
          component: () => import('@/views/me/MeIndex.vue')
        }
      ]
    },
    {
      // 搜索
      path: '/search',
      component: () => import('@/views/search/SearchIndex.vue')
    },
    {
      // 帖子搜索结果页
      path: '/search/result',
      component: () => import('@/views/search/SearchResult.vue')
    },
    {
      // 用户搜索页
      path: '/search/user',
      component: () => import('@/views/search/AddUser.vue')
    },
    {
      // 编辑用户信息
      path: '/me/content',
      component: () => import('@/views/me/MeContent.vue')
    },
    {
      // 黑名单
      path: '/black',
      component: () => import('@/views/me/BlackIndex.vue')
    },
    {
      // 我的收藏
      path: '/collection',
      component: () => import('@/views/me/CollectionIndex.vue')
    },
    {
      // 任务评价页
      path: '/rate',
      component: () => import('@/views/task/TaskRate.vue')
    },
    {
      // 发朋友圈写内容页 编辑朋友圈页
      path: '/posts/content/:id?',
      component: () => import('@/views/post/PostPublish.vue')
    },
    {
      // 加好友申请信息页
      path: '/friends/apply'
    },
    {
      // 我的帖子页
      path: '/posts/list',
      component: () => import('@/views/me/PostList.vue')
    },
    {
      // 我的任务
      path: '/mytasks',
      component: () => import('@/views/me/TaskList.vue')
    },
    {
      // 我的喜欢页
      path: '/likes',
      component: () => import('@/views/me/LikesList.vue')
    },
    {
      // 搜索好友页
      path: '/search/partner',
      component: () => import('@/views/search/SearchFriend.vue')
    },
    {
      // 发布任务和编辑任务
      path: '/task/publish/:id?',
      component: () => import('@/views/task/PublishTask.vue')
    },
    {
      // 任务详情
      path: '/task/detail/:id',
      component: () => import('@/views/task/TaskDetail.vue')
    },
    {
      // 朋友圈详情页
      path: '/posts/detail/:id',
      component: () => import('@/views/post/PostDetail.vue')
    },
    {
      // 用户主页
      path: '/user/:id',
      component: () => import('@/views/user/UserInfo.vue')
    },
    {
      // 聊天页
      path: '/chat',
      component: () => import('@/views/message/ChatIndex.vue')
    },
    {
      // 系统通知 互动通知页
      path: '/notice/:type',
      component: () => import('@/views/message/NoticeList.vue')
    },
    {
      // 404
      path: '/notfound',
      component: () => import('@/views/404/NotFound.vue')
    },
    {
      // 分享动态
      path: '/share',
      component: () => import('@/components/ShareIndex.vue')
    },
    {
      // 好友申请详情页
      path: '/friends/apply',
      component: () => import('@/views/friends/FriendApply.vue')
    }
  ],
})

// 需要登录才可以访问的页面路径前缀
const authPagePrefixes = [
  '/rate',
  '/chat',
  '/collection',
  '/posts/content/',
  '/myposts/list',
  '/friends/apply',
  '/black',
  '/posts/list',
  '/likes',
  '/task/publish/',
  '/task/detail/',
  '/posts/detail/',
  '/user/',
  '/search/partner',
  '/me/content'
]

/* router.beforeEach((to) => {
  const userStore = useUserStore()

  // 检查是否需要认证
  const needAuth = authPagePrefixes.some(prefix => to.path.startsWith(prefix))

  // 如果不需要认证，直接通过
  if (!needAuth) {
    return true
  }

  // 如果需要认证但没有token，跳转到登录页
  if (!userStore.token) {
    return `/login?backUrl=${encodeURIComponent(to.fullPath)}`
  }

  // 认证通过
  return true
}) */

export default router
