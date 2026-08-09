<script setup>
import { computed } from 'vue'
import { formatDate } from '@/lib/timezone'

/* approved reviews on a provider profile.

   the star row is aria-hidden and the rating is written out beside it,
   because five icons read as five separate images otherwise. */

const props = defineProps({
  reviews: { type: Array, required: true },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
})

const stars = (rating) => [1, 2, 3, 4, 5].map((n) => n <= Math.round(rating))
const hasRating = computed(() => props.ratingCount > 0)

</script>

<template>
  <div>
    <p v-if="hasRating" class="rating-summary">
      <span aria-hidden="true">
        <i
          v-for="(filled, i) in stars(ratingAvg)"
          :key="i"
          class="bi"
          :class="filled ? 'bi-star-fill' : 'bi-star'"
        ></i>
      </span>
      <strong>{{ ratingAvg }} out of 5</strong>
      from {{ ratingCount }} {{ ratingCount === 1 ? 'review' : 'reviews' }}
    </p>
    <p v-else class="text-muted">
      No reviews yet. If you have been here, yours would be the first.
    </p>

    <article v-for="review in reviews" :key="review.id" class="review">
      <p class="mb-1">
        <span aria-hidden="true">
          <i
            v-for="(filled, i) in stars(review.rating)"
            :key="i"
            class="bi"
            :class="filled ? 'bi-star-fill' : 'bi-star'"
          ></i>
        </span>
        <span class="visually-hidden">{{ review.rating }} out of 5.</span>
        <span class="review__by">
          {{ review.displayName || 'Community member' }}
          <template v-if="review.createdAt">
            &middot; {{ formatDate(review.createdAt) }}
          </template>
        </span>
      </p>
      <p v-if="review.comment" class="mb-0">{{ review.comment }}</p>
    </article>
  </div>
</template>

<style scoped>
.rating-summary {
  font-size: 1.05rem;
  color: var(--iris-purple-900);
}

.rating-summary .bi,
.review .bi {
  color: var(--iris-purple-900);
}

.review {
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.review__by {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  color: var(--iris-ink-muted);
}
</style>
