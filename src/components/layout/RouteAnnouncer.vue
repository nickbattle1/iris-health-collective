<script setup>
import { useAnnouncer } from '@/composables/useAnnouncer'

const { message } = useAnnouncer()
</script>

<template>
  <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
    {{ message }}
  </div>
</template>
