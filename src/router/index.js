import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useAnnouncer } from '@/composables/useAnnouncer'

import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Home' },
  },
  {
    path: '/crisis',
    name: 'crisis',
    component: () => import('@/views/CrisisView.vue'),
    meta: { title: 'Need support now' },
  },
  {
    path: '/directory',
    name: 'directory',
    component: () => import('@/views/DirectoryView.vue'),
    meta: { title: 'Find affirming care' },
  },
  {
    path: '/book',
    name: 'book',
    component: () => import('@/views/BookingView.vue'),
    meta: { title: 'Book a session' },
  },
  {
    path: '/resources',
    name: 'resources',
    component: () => import('@/views/ResourcesView.vue'),
    meta: { title: 'Resources and education' },
  },
  {
    path: '/get-involved',
    name: 'get-involved',
    component: () => import('@/views/GetInvolvedView.vue'),
    meta: { title: 'Get involved' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About and privacy' },
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('@/views/AccountView.vue'),
    meta: { title: 'My account' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page not found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

// set the title, announce it, then move focus to main. without this a keyboard
//user stays wherever they were and has no idea the page changed.
router.afterEach((to) => {
  const { announce } = useAnnouncer()
  const pageTitle = to.meta.title ?? 'Iris Health Collective'

  document.title = `${pageTitle} | Iris Health Collective`

  nextTick(() => {
    announce(`${pageTitle} page loaded`)
    document.getElementById('main-content')?.focus()
  })
})

export default router
