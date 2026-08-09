<script setup>
import { computed } from 'vue'
import { formatDate, formatTime } from '@/lib/timezone'
import { MODALITIES } from '@/lib/schemas'

// "Counselling with A. Kaur, Tue 2:30 pm", straight off the wireframe. step 2
// shows what step 1 picked so nobody fills in a form wondering what it's for

const props = defineProps({
  service: { type: Object, required: true },
  startAt: { type: String, required: true },
  modality: { type: String, default: '' },
  editable: { type: Boolean, default: true },
})

const start = computed(() => new Date(props.startAt))
</script>

<template>
  <div class="booking-summary">
    <div>
      <p class="fw-bold mb-1">{{ service.name }} with {{ service.practitionerName }}</p>
      <p class="mb-0 small">
        {{ formatDate(start) }} at {{ formatTime(start) }}
        &middot; {{ service.durationMinutes }} minutes
        <template v-if="MODALITIES[modality]"> &middot; {{ MODALITIES[modality] }}</template>
      </p>
    </div>
    <RouterLink v-if="editable" to="/book" class="btn btn-link fw-semibold p-0 text-nowrap">
      Change<span class="visually-hidden"> the service or time</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.booking-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  margin-bottom: 1.5rem;
  background: var(--iris-purple-50);
  border: 1px solid var(--iris-purple-100);
  border-radius: var(--iris-radius-md);
}
</style>
