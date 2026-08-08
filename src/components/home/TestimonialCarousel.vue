<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/* rotating testimonials from the three A1 personas.

   advances every five seconds. it pauses while the pointer is over the panel
   or while focus is inside, so nobody gets moved off mid sentence, and
   touching any control stops it for good. reduced motion removes the
   crossfade but leaves the rotation, since the objection there is to
   animation rather than to content changing. */

const testimonials = [
  {
    name: 'Priya',
    age: 28,
    image: '/images/priya.jpeg',
    rating: 5,
    quote:
      'I found a doctor who respected my name, my identity and my background. Booking online meant I could ask for the care I needed without having to explain myself over the phone.',
  },
  {
    name: 'Darius',
    age: 17,
    image: '/images/darius.jpeg',
    rating: 5,
    quote:
      'I could explore everything privately, without creating an account or worrying about notifications. For the first time, I felt safe enough to look for support.',
  },
  {
    name: 'Graham',
    age: 58,
    image: '/images/graham.jpeg',
    rating: 4.5,
    quote:
      'The website was clear, simple and easy to use. I booked my appointment without any confusion, and the discreet reminder helped me keep my health private.',
  },
]

const index = ref(0)
const held = ref(false)
const stopped = ref(false)
let timer = null

const active = computed(() => testimonials[index.value])

function go(step) {
  index.value = (index.value + step + testimonials.length) % testimonials.length
}

// a deliberate interaction ends the rotation, so the reader keeps control
function pick(target) {
  stopped.value = true
  index.value = target
}

function nudge(step) {
  stopped.value = true
  go(step)
}

function starFor(rating, position) {
  if (rating >= position) return 'bi-star-fill'
  if (rating >= position - 0.5) return 'bi-star-half'
  return 'bi-star'
}

onMounted(() => {
  timer = window.setInterval(() => {
    if (!held.value && !stopped.value) go(1)
  }, 5000)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <section
    class="why-us"
    aria-labelledby="why-us-heading"
    @mouseenter="held = true"
    @mouseleave="held = false"
    @focusin="held = true"
    @focusout="held = false"
  >
    <h2 id="why-us-heading" class="why-us__title">Why us?</h2>
    <p class="why-us__subtitle">Hear from people who found care through Iris.</p>

    <div class="why-us__row">
      <button
        type="button"
        class="why-us__arrow"
        aria-label="Previous testimonial"
        @click="nudge(-1)"
      >
        <i class="bi bi-chevron-left" aria-hidden="true"></i>
      </button>

      <div class="why-us__stage">
        <Transition name="fade" mode="out-in">
          <figure :key="active.name" class="why-us__slide">
            <img :src="active.image" :alt="`${active.name}, ${active.age}`" class="why-us__avatar" />

            <p class="why-us__stars">
              <i
                v-for="position in 5"
                :key="position"
                class="bi"
                :class="starFor(active.rating, position)"
                aria-hidden="true"
              ></i>
              <span class="visually-hidden">Rated {{ active.rating }} out of 5</span>
            </p>

            <blockquote class="why-us__quote">{{ active.quote }}</blockquote>

            <figcaption class="why-us__author">{{ active.name }}, {{ active.age }}</figcaption>
          </figure>
        </Transition>
      </div>

      <button
        type="button"
        class="why-us__arrow"
        aria-label="Next testimonial"
        @click="nudge(1)"
      >
        <i class="bi bi-chevron-right" aria-hidden="true"></i>
      </button>
    </div>

    <div class="why-us__dots">
      <button
        v-for="(item, i) in testimonials"
        :key="item.name"
        type="button"
        class="why-us__dot"
        :class="{ 'is-on': i === index }"
        :aria-current="i === index ? 'true' : undefined"
        :aria-label="`Show testimonial from ${item.name}`"
        @click="pick(i)"
      ></button>
    </div>
  </section>
</template>

<style scoped>
.why-us {
  padding: 2.5rem 1rem 1.5rem;
  margin-bottom: 3rem;
  background: var(--iris-purple-900);
  border-radius: var(--iris-radius-lg);
  text-align: center;
  color: #fff;
}

.why-us__title {
  color: #fff;
  font-weight: 800;
  margin-bottom: 0.4rem;
}

.why-us__subtitle {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 1.5rem;
}

.why-us__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.why-us__stage {
  flex: 1 1 auto;
  max-width: 42rem;
  min-height: 450px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.why-us__slide {
  margin: 0;
  padding: 0 0.5rem;
}

.why-us__avatar {
  width: 210px;
  height: 210px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center top;
  margin-bottom: 1.25rem;
}

.why-us__stars {
  color: var(--iris-pink);
  font-size: 1.5rem;
  letter-spacing: 0.18rem;
  margin-bottom: 1rem;
}

.why-us__quote {
  font-size: 1.27rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.why-us__quote::before { content: '\201C'; }
.why-us__quote::after { content: '\201D'; }

.why-us__author {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--iris-pink);
}

.why-us__arrow {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border: 2px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
}

.why-us__arrow:hover,
.why-us__arrow:focus-visible {
  border-color: var(--iris-pink);
  color: var(--iris-pink);
}

.why-us__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.why-us__dot {
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.why-us__dot::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
}

.why-us__dot.is-on::after {
  background: var(--iris-pink);
  width: 16px;
  height: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* on phones this stops being a card and becomes a full width band. the
   negative margins pull it out past the bootstrap container padding. */
@media (max-width: 767.98px) {
  .why-us {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    border-radius: 0;
    padding: 2.5rem 1rem 1.5rem;
  }

  .why-us__stage { min-height: 500px; }
  .why-us__avatar { width: 165px; height: 165px; }
  .why-us__quote { font-size: 1.15rem; }
  .why-us__arrow { width: 42px; height: 42px; }
}

/* the crossfade goes, the rotation stays */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
