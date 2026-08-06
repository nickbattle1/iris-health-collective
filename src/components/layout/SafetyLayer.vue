<script setup>
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/* the persistent safety layer from A1. sits above nav on every page so both
   controls are reachable without scrolling.

   exit uses location.replace rather than href, so the page drops out of session
   history and the back button won't return to it (Turk & Hutchings, 2023).*/

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const navOpen = ref(false)
const sheet = ref(null)
const menuButton = ref(null)

const links = computed(() => {
  const base = [
    { to: '/directory', label: 'Find affirming care' },
    { to: '/book', label: 'Book a session' },
    { to: '/resources', label: 'Resources and education' },
    { to: '/get-involved', label: 'Get involved' },
    { to: '/about', label: 'About and privacy' },
  ]

  if (auth.isAdmin) base.push({ to: '/admin', label: 'Staff dashboard' })

  return auth.isAuthenticated
    ? [...base, { to: '/account', label: 'My account' }]
    : [...base, { to: '/login', label: 'Sign in' }]
})

function exitSite() {
  window.location.replace('https://www.google.com/search?q=weather+melbourne')
}

async function signOut() {
  closeNav()
  await auth.logout()
  router.push('/')
}

async function openNav() {
  navOpen.value = true
  await nextTick()
  sheet.value?.querySelector('a, button')?.focus()
}

function closeNav() {
  navOpen.value = false
  menuButton.value?.focus()
}

function onKeydown(event) {
  if (event.key !== 'Escape') return

  // esc closes the menu first. with nothing open it leaves the site.
  if (navOpen.value) {
    closeNav()
    return
  }

  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  exitSite()
}

watch(() => route.fullPath, () => {
  navOpen.value = false
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="safety-bar">
    <div class="container">
      <div class="safety-bar__inner">
        <button
          ref="menuButton"
          type="button"
          class="icon-button"
          :aria-expanded="navOpen"
          aria-controls="primary-navigation"
          aria-label="Open navigation menu"
          @click="openNav"
        >
          <i class="bi bi-list fs-3" aria-hidden="true"></i>
        </button>

        <!-- the logo is the way home from any page, so it carries a real alt.
             picture swaps the wordmark for the eye mark on small screens, which
             is art direction rather than resolution, so srcset is the wrong
             tool. both safety controls keep their labels either way. -->
        <RouterLink to="/" class="safety-bar__brand">
          <picture>
            <source media="(max-width: 575.98px)" srcset="/images/logo-eye.png" />
            <img src="/images/logo.png" alt="Iris Health Collective, home" />
          </picture>
        </RouterLink>

        <div class="ms-auto d-flex align-items-center gap-2">
          <RouterLink to="/crisis" class="btn-iris-outline">Crisis help</RouterLink>
          <button type="button" class="btn-iris" @click="exitSite">Quick exit</button>
        </div>
      </div>
    </div>
  </header>

  <div v-if="navOpen" class="nav-panel">
    <button
      type="button"
      class="nav-panel__backdrop"
      aria-label="Close navigation menu"
      @click="closeNav"
    ></button>

    <nav id="primary-navigation" ref="sheet" class="nav-panel__sheet" aria-label="Primary">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="fw-bold">Menu</span>
        <button type="button" class="icon-button" aria-label="Close menu" @click="closeNav">
          <i class="bi bi-x-lg fs-5" aria-hidden="true"></i>
        </button>
      </div>

      <p v-if="auth.isAuthenticated" class="text-muted small mb-3">
        Signed in as {{ auth.displayName }}
      </p>

      <ul class="list-unstyled mb-0">
        <li v-for="link in links" :key="link.to">
          <RouterLink class="nav-panel__link" :to="link.to">{{ link.label }}</RouterLink>
        </li>
      </ul>

      <button
        v-if="auth.isAuthenticated"
        type="button"
        class="btn btn-link px-2 mt-3"
        @click="signOut"
      >
        Sign out
      </button>
    </nav>
  </div>
</template>

<style scoped>
.safety-bar__brand {
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;
}

.safety-bar__brand img {
  height: 42px;
  width: auto;
}

/* on a narrow phone the wordmark and both safety buttons will not sit on one
   row. the eye mark and tighter padding buy back the space, so crisis help
   stays one tap from every page as US-7 requires. targets stay 48px tall. */
@media (max-width: 575.98px) {
  .safety-bar__inner {
    gap: 0.4rem;
  }

  .safety-bar__brand {
    margin-left: 0;
  }

  .safety-bar__brand img {
    height: 34px;
  }

  .safety-bar .btn-iris,
  .safety-bar .btn-iris-outline {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 359.98px) {
  .safety-bar .btn-iris,
  .safety-bar .btn-iris-outline {
    padding: 0.5rem 0.6rem;
    font-size: 0.82rem;
  }
}
</style>
