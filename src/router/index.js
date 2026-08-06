import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useAuthStore } from '@/stores/auth'

import HomeView from '@/views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Home' } },
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
    path: '/directory/:slug',
    name: 'provider',
    component: () => import('@/views/ProviderView.vue'),
    meta: { title: 'Provider profile' },
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
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: 'Sign in', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: 'Create an account', guestOnly: true },
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('@/views/AccountView.vue'),
    meta: { title: 'My account', requiresAuth: true },
  },
  {
    path: '/account/privacy',
    name: 'account-privacy',
    component: () => import('@/views/AccountPrivacyView.vue'),
    meta: { title: 'Privacy and data', requiresAuth: true },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { title: 'Access denied' },
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

/* these guards are user experience, not security. they stop someone landing on
   a screen that would fail to load. the actual authorisation boundary is
   firestore.rules, which holds even if someone calls the api directly. */
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ready

  // an error from the last screen should not follow you onto the next one
  auth.clearError()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'forbidden' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'account' }
  }
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
