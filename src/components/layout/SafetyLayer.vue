<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

/* the persistent safety layer from A1. sits above nav on every page so both
   controls are reachable without scrolling.

   exit uses location.replace rather than href, so the page drops out of session
   history and the back button won't return to it (Turk & Hutchings, 2023).*/

const route = useRoute()
const navOpen = ref(false)
const sheet = ref(null)
const menuButton = ref(null)

const links = [
  { to: '/directory', label: 'Find affirming care' },
  { to: '/book', label: 'Book a session' },
  { to: '/resources', label: 'Resources and education' },
  { to: '/get-involved', label: 'Get involved' },
  { to: '/about', label: 'About and privacy' },
  { to: '/account', label: 'My account' },
]

function exitSite() {
  window.location.replace('https://www.google.com/search?q=weather+melbourne')
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

        <div class="ms-auto d-flex align-items-center gap-2">
          <RouterLink to="/crisis" class="btn-iris-outline">Crisis help</RouterLink>
          <button type="button" class="btn-iris" @click="exitSite">Exit site</button>
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

      <ul class="list-unstyled mb-0">
        <li v-for="link in links" :key="link.to">
          <RouterLink class="nav-panel__link" :to="link.to">{{ link.label }}</RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
