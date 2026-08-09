<script setup>
import { computed } from 'vue'
import { formatShortDate, formatTime, ZONE } from '@/lib/timezone'

/* an agenda rather than a month grid.

   the sitemap says calendar and this is what a calendar should be here. the
   charity runs six or so things a month, so a grid would be mostly empty cells,
   and a grid is the wrong shape on a phone besides. grouping by month with a
   date block down the left reads the same way and works at any width. */

const props = defineProps({
  events: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})

defineEmits(['register'])

const monthLabel = new Intl.DateTimeFormat('en-AU', {
  timeZone: ZONE,
  month: 'long',
  year: 'numeric',
})

const dayNumber = new Intl.DateTimeFormat('en-AU', { timeZone: ZONE, day: 'numeric' })
const dayName = new Intl.DateTimeFormat('en-AU', { timeZone: ZONE, weekday: 'short' })

// Map keeps insertion order, and the query already comes back sorted
const months = computed(() => {
  const grouped = new Map()
  for (const event of props.events) {
    if (!event.startAt) continue
    const key = monthLabel.format(event.startAt)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(event)
  }
  return [...grouped.entries()]
})

const modalityLabel = {
  'in-person': 'In person',
  online: 'Online',
  hybrid: 'In person or online',
}
</script>

<template>
  <div>
    <p v-if="loading" class="text-muted" aria-busy="true">Loading events...</p>

    <p v-else-if="!events.length" class="text-muted">
      Nothing scheduled just now. New sessions go up about a month ahead.
    </p>

    <section v-for="[month, list] in months" :key="month" class="mb-4" :aria-label="month">
      <h3 class="month-heading">{{ month }}</h3>

      <article v-for="event in list" :key="event.slug" class="event">
        <p class="event__date" aria-hidden="true">
          <span class="event__day">{{ dayNumber.format(event.startAt) }}</span>
          <span class="event__weekday">{{ dayName.format(event.startAt) }}</span>
        </p>

        <div class="event__body">
          <h4 class="h6 mb-1">{{ event.name }}</h4>
          <p class="event__meta mb-2">
            <span class="visually-hidden">{{ formatShortDate(event.startAt) }}, </span>
            {{ formatTime(event.startAt) }} to {{ formatTime(event.endAt) }}
            &middot; {{ modalityLabel[event.modality] ?? event.modality }}
            &middot; {{ event.cost }}
          </p>
          <p class="mb-1 small">{{ event.description }}</p>
          <p class="event__meta mb-2">
            <i class="bi bi-geo-alt" aria-hidden="true"></i> {{ event.location }}
          </p>

          <button type="button" class="btn-iris-outline btn-sm" @click="$emit('register', event)">
            Register<span class="visually-hidden"> for {{ event.name }}</span>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.month-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--iris-purple-900);
  padding-bottom: 0.4rem;
  border-bottom: 2px solid var(--iris-purple-100);
  margin-bottom: 0.9rem;
}

.event {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--iris-border);
}

.event:last-child {
  border-bottom: 0;
}

.event__date {
  flex: 0 0 3.4rem;
  margin: 0;
  padding: 0.5rem 0;
  text-align: center;
  border-radius: var(--iris-radius-sm);
  background: var(--iris-purple-50);
}

.event__day {
  display: block;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--iris-purple-900);
}

.event__weekday {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--iris-ink-muted);
}

.event__meta {
  font-size: 0.85rem;
  color: var(--iris-ink-muted);
}

.btn-sm {
  min-height: 40px;
  padding: 0.35rem 0.9rem;
  font-size: 0.9rem;
}
</style>
