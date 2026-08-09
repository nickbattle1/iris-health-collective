<script setup>
import { RouterLink } from 'vue-router'
import { onMounted, ref } from 'vue'
import TestimonialCarousel from '@/components/home/TestimonialCarousel.vue'
import { fetchFeaturedResources } from '@/services/resourceService'

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

const featuredResources = ref([])

onMounted(async () => {
  try {
    featuredResources.value = await fetchFeaturedResources()
  } catch (err) {
    // the home page is still a home page without three cards on it
    console.error('[home] featured resources', err)
  }
})
</script>

<template>
  <div class="container py-4 py-lg-5">
    <section class="mb-4" aria-labelledby="hero-heading">
      <img
        src="/images/home.jpeg"
        alt=""
        class="hero-image"
        width="1600"
        height="900"
        fetchpriority="high"
      />
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
          <span class="nowrap">QLife: 1800 184 527</span>
          <span aria-hidden="true">&nbsp;|&nbsp;</span>
          <span class="nowrap">Emergency: 000</span>
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
      <div class="section-head">
        <h2 id="resources-heading" class="section-heading mb-0">Resources for you</h2>
        <RouterLink to="/resources" class="section-head__more">
          See more<span class="visually-hidden"> resources</span>
          <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </RouterLink>
      </div>
      <div class="row g-3">
        <div v-for="item in featuredResources" :key="item.slug" class="col-12 col-md-4">
          <!-- one link per card, stretched over the whole tile. a second link
               on the image would give a screen reader the same destination
               twice with nothing useful to tell them apart. -->
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
              <h3 class="h6 mb-2">
                <RouterLink :to="`/resources/${item.slug}`" class="stretched-link resource-card__link">
                  {{ item.title }}
                </RouterLink>
              </h3>
              <p class="mb-3 small text-muted">{{ item.summary }}</p>
              <span class="fw-semibold resource-card__more" aria-hidden="true">Read more</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* a phone number split across two lines is not a phone number. the break is
   allowed between the two services, never inside one */
.nowrap {
  white-space: nowrap;
}

/* full width above the headline, whole image, no crop at any size */
.hero-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--iris-radius-md);
  margin-bottom: 1.5rem;
}

.resource-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.section-head__more {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  color: var(--iris-purple-900);
  text-decoration: none;
}

.section-head__more:hover,
.section-head__more:focus-visible {
  text-decoration: underline;
}

.resource-card__link {
  color: var(--iris-purple-900);
  text-decoration: none;
}

/* the whole tile is the target, so the focus ring belongs on the tile rather
   than on the few words of the title that happen to carry the link */
.resource-card:has(.resource-card__link:focus-visible) {
  outline: 3px solid var(--iris-purple-900);
  outline-offset: 2px;
}

.resource-card:hover .resource-card__link,
.resource-card__link:focus-visible {
  text-decoration: underline;
}

/* a cue, not a control. the card is already one link and this sits under the
   overlay, so it is hidden from assistive tech and never receives the click */
.resource-card__more {
  color: var(--iris-purple-900);
}

.resource-card:hover {
  border-color: var(--iris-purple-500);
}
</style>

