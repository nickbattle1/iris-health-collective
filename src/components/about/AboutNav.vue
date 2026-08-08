<script setup>
/* the three pages the A1 sitemap puts under About and privacy. they cross link
   rather than nest, because the privacy policy is reached from the footer of
   every page and should not feel like a sub page of our story */

const links = [
  { to: '/about', label: 'About us' },
  { to: '/about/privacy', label: 'Privacy and safety' },
  { to: '/about/contact', label: 'Contact us' },
]
</script>

<template>
  <nav aria-label="About section" class="about-nav">
    <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="about-nav__link">
      {{ link.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.about-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.about-nav__link {
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

.about-nav__link:hover {
  background: var(--iris-purple-50);
}

/* router-link-exact-active rather than active, or About us stays lit while you
   are reading the privacy policy */
.about-nav__link.router-link-exact-active {
  background: var(--iris-purple-900);
  color: #fff;
}
</style>
