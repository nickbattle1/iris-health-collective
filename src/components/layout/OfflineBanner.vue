<script setup>
import { useOnlineStatus } from '@/composables/useOnlineStatus'

/* shown only when the connection drops.

   it names what still works rather than only what does not, because the whole
   reason the crisis page is precached is that it has to be reachable on a bad
   connection. */

const { online } = useOnlineStatus()
</script>

<template>
  <div v-if="!online" class="offline" role="status" aria-live="polite">
    <i class="bi bi-wifi-off" aria-hidden="true"></i>
    <span>
      You are offline. Crisis contacts and anything you have saved still work.
      Booking and search need a connection.
    </span>
  </div>
</template>

<style scoped>
.offline {
  position: sticky;
  top: 0;
  z-index: 1030;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  background: var(--iris-ink, #243b47);
  color: #fff;
  font-size: 0.92rem;
}
</style>
