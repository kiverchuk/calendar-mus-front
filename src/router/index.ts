import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/LandingView.vue'),
    },
    {
      path: '/cm',
      name: 'calendar',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/landing',
      redirect: '/',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  if (!auth.ready.value) await auth.bootstrap()

  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { path: '/', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
