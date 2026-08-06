<script setup>
import { RouterLink } from 'vue-router'
import { BADGES, INCLUSION_BASIS } from '@/constants/badges'

const props = defineProps({
  provider: { type: Object, required: true },
})

// only live claims get a badge on the card. the profile shows the rest.
const liveBadges = () =>
  (props.provider.accreditations ?? [])
    .filter((a) => a.status === 'verified')
    .map((a) => BADGES[a.badgeCode]?.label)
    .filter(Boolean)
</script>

<template>
  <RouterLink :to="`/directory/${provider.slug}`" class="provider-card">
    <div class="provider-card__head">
      <span class="provider-card__avatar" aria-hidden="true">
        <i class="bi bi-person-fill"></i>
      </span>
      <div class="flex-grow-1">
        <h3 class="h5 mb-1">{{ provider.name }}</h3>
        <p class="mb-1 text-muted small">{{ provider.practiceName }}, {{ provider.suburb }}</p>
      </div>
      <span class="text-muted small text-nowrap">{{ provider.distance.toFixed(1) }} km</span>
    </div>

    <p v-if="liveBadges().length" class="provider-card__badges mb-2">
      <span v-for="label in liveBadges()" :key="label" class="badge-pill">
        <i class="bi bi-patch-check-fill" aria-hidden="true"></i> {{ label }}
      </span>
    </p>

    <p class="mb-0 small">
      <span class="text-muted">Why listed:</span>
      {{ INCLUSION_BASIS[provider.inclusionBasis] }}
      <span v-if="provider.ratingCount" class="text-muted">
        &nbsp;&middot;&nbsp; {{ provider.ratingAvg }} from {{ provider.ratingCount }} reviews
      </span>
    </p>
  </RouterLink>
</template>

<style scoped>
.provider-card {
  display: block;
  padding: 1.15rem;
  margin-bottom: 1rem;
  background: var(--iris-surface-muted);
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  color: var(--iris-ink);
  text-decoration: none;
}

.provider-card:hover,
.provider-card:focus {
  background: var(--iris-purple-50);
  border-color: var(--iris-purple-500);
  color: var(--iris-ink);
}

.provider-card__head {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  margin-bottom: 0.75rem;
}

.provider-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--iris-surface);
  border: 1px solid var(--iris-border);
  color: var(--iris-purple-900);
  font-size: 1.5rem;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0 0.4rem 0.4rem 0;
  padding: 0.25rem 0.7rem;
  border-radius: var(--iris-radius-pill);
  background: var(--iris-purple-100);
  color: var(--iris-purple-900);
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
