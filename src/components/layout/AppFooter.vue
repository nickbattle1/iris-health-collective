<script setup>
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <nav aria-label="Footer" class="mb-3">
        <ul class="list-inline mb-0">
          <li class="list-inline-item me-3">
            <RouterLink to="/about">Privacy policy</RouterLink>
          </li>
          <li class="list-inline-item me-3">
            <RouterLink to="/about">Accessibility statement</RouterLink>
          </li>
          <li class="list-inline-item">
            <RouterLink to="/about">Contact us</RouterLink>
          </li>
        </ul>
      </nav>

      <p class="mb-2">
        Iris Health Collective acknowledges the Traditional Owners of the lands on which
        we work, and pays respect to Elders past and present.
      </p>

      <p class="text-muted mb-0">
        &copy; {{ year }} Iris Health Collective. A fictional charity created for
        Monash University ITO5032.
      </p>
    </div>
  </footer>
</template>
