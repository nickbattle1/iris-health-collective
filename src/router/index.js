import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'

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
    path: '/crisis/support-services',
    name: 'support-services',
    component: () => import('@/views/crisis/SupportServicesView.vue'),
    meta: { title: 'More support options' },
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

  // three child routes rather than a counter inside one component. each step
  // gets a URL, a title for the announcer and a back button that works. the
  // guard below is what stops anyone deep linking into step 3
  {
    path: '/book',
    component: () => import('@/views/BookingView.vue'),
    children: [
      {
        path: '',
        name: 'book',
        component: () => import('@/views/booking/ServiceStep.vue'),
        meta: { title: 'Book a session', step: 1 },
      },
      {
        path: 'details',
        name: 'book-details',
        component: () => import('@/views/booking/DetailsStep.vue'),
        meta: { title: 'Your details, step 2 of 3', step: 2 },
      },
      {
        path: 'confirm',
        name: 'book-confirm',
        component: () => import('@/views/booking/ConfirmStep.vue'),
        meta: { title: 'Booking confirmed', step: 3 },
      },
    ],
  },

  {
    path: '/resources',
    name: 'resources',
    component: () => import('@/views/ResourcesView.vue'),
    meta: { title: 'Resources and education' },
  },
  {
    path: '/resources/:slug',
    name: 'resource',
    component: () => import('@/views/resources/ResourceDetailView.vue'),
    meta: { title: 'Resource' },
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
    meta: { title: 'About us' },
  },
  {
    path: '/about/privacy',
    name: 'about-privacy',
    component: () => import('@/views/about/PrivacyView.vue'),
    meta: { title: 'Privacy and safety' },
  },
  {
    path: '/about/contact',
    name: 'about-contact',
    component: () => import('@/views/about/ContactView.vue'),
    meta: { title: 'Contact us' },
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
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/DashboardView.vue'),
    meta: { title: 'Staff dashboard', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/reviews',
    name: 'admin-reviews',
    component: () => import('@/views/admin/ModerationView.vue'),
    meta: { title: 'Review queue', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/enquiries',
    name: 'admin-enquiries',
    component: () => import('@/views/admin/EnquiriesView.vue'),
    meta: { title: 'Enquiries', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/bookings',
    name: 'admin-bookings',
    component: () => import('@/views/admin/BookingsView.vue'),
    meta: { title: 'Bookings', requiresAuth: true, roles: ['admin'] },
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

// these guards are UX, not security. they stop you landing on a screen that
// would fail to load. the real boundary is firestore.rules, which holds even
// if someone skips the app and calls the API
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

  // a step only exists once the one before it is done. /book/confirm with no
  // booking sends you back to the start instead of showing an empty
  // confirmation for an appointment that doesn't exist
  const booking = useBookingStore()
  if (to.name === 'book-details' && !booking.hasSelection) return { name: 'book' }
  if (to.name === 'book-confirm' && !booking.lastBooking) return { name: 'book' }
})

// set the title, announce it, move focus to main. without this a keyboard user
// stays where they were and has no idea the page changed
router.afterEach((to, from) => {
  /* leaving the wizard clears it, otherwise a selection from last week is
     still sitting there next time you open /book.

     signing in is not leaving. the whole point of the account prompt on the
     confirmation screen is that you come back to it, and resetting on the way
     out was throwing the booking away before you got there. */
  const goingToAuth = to.path === '/login' || to.path === '/register'
  if (from.path.startsWith('/book') && !to.path.startsWith('/book') && !goingToAuth) {
    useBookingStore().reset()
  }

  const { announce } = useAnnouncer()
  const pageTitle = to.meta.title ?? 'Iris Health Collective'

  document.title = `${pageTitle} | Iris Health Collective`

  nextTick(() => {
    announce(`${pageTitle} page loaded`)
    // skip the initial load. from.name is undefined then, and focusing main
    // would put the skip link behind the tab order before anyone can reach it
    if (from.name !== undefined) document.getElementById('main-content')?.focus()
  })
})

/* every build renames the chunk files. anyone still holding the previous
   service worker gets an index.html pointing at names that no longer exist, and
   the route dies with "failed to fetch dynamically imported module".

   reloading pulls the new index.html with the new names. the sessionStorage
   flag stops it looping if the chunk is genuinely missing rather than stale. */
router.onError((error, to) => {
  const stale = /dynamically imported module|Importing a module script failed/i.test(
    error?.message ?? '',
  )
  if (!stale) return

  const key = 'iris.chunk-reload'
  if (sessionStorage.getItem(key) === to.fullPath) return

  sessionStorage.setItem(key, to.fullPath)
  window.location.assign(to.fullPath)
})

export default router

