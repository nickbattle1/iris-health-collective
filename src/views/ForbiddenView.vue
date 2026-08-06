<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// explains rather than silently bouncing someone back to the home page
const auth = useAuthStore()
</script>

<template>
  <div class="container py-5" style="max-width: 620px">
    <h1>You do not have access to that page</h1>
    <p class="hero-lead">
      That area is for charity staff. You are signed in as a
      {{ auth.role === 'provider' ? 'provider' : 'community member' }}.
    </p>
    <p>
      If you think this is wrong, contact us and we can check your account.
    </p>
    <div class="d-flex flex-wrap gap-2 mt-4">
      <RouterLink to="/" class="btn-iris">Back to home</RouterLink>
      <RouterLink to="/account" class="btn-iris-outline">My account</RouterLink>
    </div>
  </div>
</template>
