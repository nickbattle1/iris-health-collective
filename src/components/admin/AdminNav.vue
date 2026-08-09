<script setup>
const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/reviews', label: 'Review queue' },
  { to: '/admin/enquiries', label: 'Enquiries' },
  { to: '/admin/bookings', label: 'Bookings' },
]
</script>

<template>
  <nav aria-label="Staff area" class="admin-nav">
    <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="admin-nav__link">
      {{ link.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.admin-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.admin-nav__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--iris-target);
  padding: 0.5rem 1.15rem;
  border: 2px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-pill);
  color: var(--iris-purple-900);
  font-weight: 700;
  text-decoration: none;
}

.admin-nav__link:hover {
  background: var(--iris-purple-50);
}

.admin-nav__link.router-link-exact-active {
  background: var(--iris-purple-900);
  color: #fff;
}
</style>
