<script setup></script>

<template>
  <div class="container py-5">
    <h1>Page not found</h1>
    <p class="hero-lead">
      That page does not exist. It may have been moved, or the address may have a typo.
    </p>
    <div class="d-flex flex-wrap gap-2 mt-4">
      <RouterLink to="/" class="btn-iris">Back to home</RouterLink>
      <RouterLink to="/crisis" class="btn-iris-outline">Need support now</RouterLink>
    </div>
  </div>
</template>
