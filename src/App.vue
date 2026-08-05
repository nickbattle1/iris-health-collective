<script setup>
import { RouterView } from 'vue-router'
import SkipLink from '@/components/layout/SkipLink.vue'
import SafetyLayer from '@/components/layout/SafetyLayer.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RouteAnnouncer from '@/components/layout/RouteAnnouncer.vue'
</script>

<template>
  <SkipLink />

  <p class="demo-notice text-center mb-0">
    Demonstration site built for university assessment. Provider listings are
    fictional. Crisis contact numbers are real.
  </p>

  <SafetyLayer />

  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>

  <AppFooter />
  <RouteAnnouncer />
</template>
