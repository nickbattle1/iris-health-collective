<script setup>
import { RouterLink } from 'vue-router'
import TestimonialCarousel from '@/components/home/TestimonialCarousel.vue'

/* home screen, figure 2 of the design report. covers user story 1 (browse with no
   account) and user story 7 (crisis contact one tap away).

   images live in public/images so the path survives the build. from day 5 the
   resource cards come from firestore, where the same paths are stored as a
   field on each document. */

const quickActions = [
  { to: '/directory', label: 'Find affirming care', icon: 'bi-search' },
  { to: '/book', label: 'Book a session', icon: 'bi-calendar-event' },
  { to: '/resources', label: 'Resources and education', icon: 'bi-book' },
  { to: '/get-involved', label: 'Get involved', icon: 'bi-heart' },
]

const featuredResources = [
  {
    title: 'Finding a GP who gets it',
    summary: 'What to ask, what to expect, and how to change providers if it is not right.',
    image: '/images/finding-gp.png',
  },
  {
    title: 'Your rights at a health service',
    summary: 'Chosen name, pronouns, privacy, and how to raise a concern.',
    image: '/images/your-rights.png',
  },
  {
    title: 'For families and allies',
    summary: 'Practical ways to support someone close to you without taking over.',
    image: '/images/families-allies.png',
  },
]
</script>

<template>
  <div class="container py-4 py-lg-5">
    <section class="mb-4" aria-labelledby="hero-heading">
      <h1 id="hero-heading" class="hero-title">
        Health care<br />that sees <span class="accent">you.</span>
      </h1>
      <p class="hero-lead">
        Find LGBTIQ+ affirming health services in Victoria you can trust.
      </p>
    </section>

    <RouterLink to="/crisis" class="crisis-banner mb-5">
      <i class="bi bi-bell-fill flex-shrink-0" style="font-size: 1.9rem" aria-hidden="true"></i>
      <span class="flex-grow-1">
        <span class="crisis-banner__title d-block">Need support now?</span>
        <span class="crisis-banner__detail d-block">
          QLife: 1800 184 527 &nbsp;|&nbsp; Emergency: 000
        </span>
      </span>
      <i class="bi bi-arrow-right fs-4" aria-hidden="true"></i>
    </RouterLink>

    <section class="mb-5" aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" class="section-heading">Quick actions</h2>
      <div class="row g-3">
        <div v-for="action in quickActions" :key="action.to" class="col-6 col-lg-3">
          <RouterLink :to="action.to" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">
              <i class="bi fs-4" :class="action.icon"></i>
            </span>
            <span>{{ action.label }}</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <TestimonialCarousel />

    <section class="mb-5" aria-labelledby="resources-heading">
      <h2 id="resources-heading" class="section-heading">Resources for you</h2>
      <div class="row g-3">
        <div v-for="item in featuredResources" :key="item.title" class="col-12 col-md-4">
          <article class="resource-card">
            <div class="resource-card__media">
              <img
                v-if="item.image"
                :src="item.image"
                alt=""
                loading="lazy"
                width="480"
                height="300"
              />
              <i v-else class="bi bi-image" style="font-size: 2.4rem" aria-hidden="true"></i>
            </div>
            <div class="p-3">
              <h3 class="h6 mb-2">{{ item.title }}</h3>
              <p class="mb-3 small text-muted">{{ item.summary }}</p>
              <RouterLink to="/resources" class="fw-semibold">
                Read more<span class="visually-hidden"> about {{ item.title }}</span>
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.resource-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
