<script setup>
import { RouterView } from 'vue-router'
import SkipLink from '@/components/layout/SkipLink.vue'
import SafetyLayer from '@/components/layout/SafetyLayer.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RouteAnnouncer from '@/components/layout/RouteAnnouncer.vue'
import OfflineBanner from '@/components/layout/OfflineBanner.vue'
</script>

<template>
  <SkipLink />

  <OfflineBanner />

  <SafetyLayer />

  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>

  <AppFooter />
  <RouteAnnouncer />
</template>

