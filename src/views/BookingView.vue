<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StepIndicator from '@/components/booking/StepIndicator.vue'

// wizard shell. steps are child routes rather than a v-if on a counter, so
// each has a URL, a title for the announcer, and a back button that goes back
// one step instead of dropping you out of the flow.
//
// A1 feedback said Booking Confirmation shouldn't be a nav item. it isn't.
// /book/confirm only opens off a completed booking, router sends everyone else
// back to step one

const route = useRoute()
const step = computed(() => route.meta.step ?? 1)
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 680px">
    <h1 class="mb-1">Book a session</h1>
    <p class="hero-lead mb-3">
      Counselling, peer navigation and group sessions run by Iris Health Collective.
      You do not need an account.
    </p>

    <p class="scope-note mb-4">
      These are our own services. To see an appointment with an independent
      GP or clinic, use
      <RouterLink to="/directory">Find affirming care</RouterLink> and contact
      the practice directly.
    </p>

    <StepIndicator :current="step" />

    <RouterView />
  </div>
</template>

<style scoped>
.scope-note {
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
  background: var(--iris-surface-muted);
  border-left: 4px solid var(--iris-purple-500);
  border-radius: var(--iris-radius-sm);
}
</style>
