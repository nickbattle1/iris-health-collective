<script setup>
/* the row under the search bar in figure 3 of the design report. where
   distances are measured from, and a way to change it.

   the browser only hands over a location after the person says yes, and the
   permission prompt is the browser's, not ours. nothing is stored: the
   coordinates live in the pinia store for this visit and go when the tab does. */

defineProps({
  label: { type: String, required: true },
  locating: { type: Boolean, default: false },
  usingPrecise: { type: Boolean, default: false },
  error: { type: String, default: '' },
  radiusKm: { type: Number, default: 0 },
})

defineEmits(['locate', 'reset', 'update:radiusKm'])

// anywhere first, because a default radius would hide every regional practice
const RADIUS_OPTIONS = [
  { value: 0, label: 'Anywhere in Victoria' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
  { value: 50, label: 'Within 50 km' },
]
</script>

<template>
  <div>
    <div class="location-bar">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <p class="mb-0">{{ label }}</p>

        <label class="visually-hidden" for="radius">How far to search</label>
        <select
          id="radius"
          class="form-select form-select-sm radius-select"
          :value="radiusKm"
          @change="$emit('update:radiusKm', Number($event.target.value))"
        >
          <option v-for="option in RADIUS_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <button v-if="usingPrecise" type="button" class="location-bar__action" @click="$emit('reset')">
        Back to Naarm (Melbourne)
      </button>
      <button
        v-else
        type="button"
        class="location-bar__action"
        :disabled="locating"
        @click="$emit('locate')"
      >
        {{ locating ? 'Finding you...' : 'Use precise location' }}
      </button>
    </div>

    <p v-if="error" class="text-danger small mb-0" role="status">{{ error }}</p>
  </div>
</template>

<style scoped>
.location-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  max-width: 42rem;
  margin-bottom: 1rem;
}

.radius-select {
  width: auto;
  min-height: 40px;
  border-color: var(--iris-border);
  font-weight: 600;
}

.location-bar__action {
  border: 0;
  background: none;
  padding: 0.4rem 0;
  min-height: var(--iris-target);
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.location-bar__action:disabled {
  color: var(--iris-ink-muted);
  cursor: default;
}
</style>
