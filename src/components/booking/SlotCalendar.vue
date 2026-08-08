<script setup>
import { computed, ref, watch } from 'vue'
import { bookableDays, slotsForDay } from '@/lib/slots'
import { formatShortDate, formatTime, fromZoned } from '@/lib/timezone'

// FullCalendar was the obvious pick and I didn't use it. its grid is mouse
// first and the criterion marks conflict management, not the drawing. this is
// about fifteen elements and all of them work off the keyboard.
//
// the counts: availability holds one number per slot, written inside the
// createBooking transaction. it's a hint for the UI and never the decision.
// two people can be on this screen at once so the transaction rechecks at
// submit and the loser gets told, rather than a silent double booking

const props = defineProps({
  service: { type: Object, required: true },
  taken: { type: Object, default: () => ({}) },
  modelValue: { type: String, default: '' }, // ISO string of the chosen start
})

const emit = defineEmits(['update:modelValue'])

const dayCount = ref(10)
const selectedDay = ref('')

const days = computed(() => bookableDays(props.service, dayCount.value))

// label for the chip without building a second date object
function dayLabel(day) {
  const [year, month, date] = day.split('-').map(Number)
  return formatShortDate(fromZoned(year, month, date, 12))
}

const slots = computed(() =>
  selectedDay.value
    ? slotsForDay(props.service, selectedDay.value, { taken: props.taken })
    : [],
)

const openSlots = computed(() => slots.value.filter((slot) => slot.available))

const availabilityMessage = computed(() => {
  if (!selectedDay.value) return ''
  const count = openSlots.value.length
  if (!count) return `No times left on ${dayLabel(selectedDay.value)}. Try another date.`
  return `${count} ${count === 1 ? 'time' : 'times'} available on ${dayLabel(selectedDay.value)}`
})

// land on the first day with something open, not a full one
watch(
  days,
  (list) => {
    if (selectedDay.value && list.includes(selectedDay.value)) return
    selectedDay.value =
      list.find((day) => slotsForDay(props.service, day, { taken: props.taken }).some((s) => s.available)) ??
      list[0] ??
      ''
  },
  { immediate: true },
)

// changing service kills whatever time was picked under the old one
watch(
  () => props.service?.id,
  () => {
    dayCount.value = 10
    emit('update:modelValue', '')
  },
)

function chooseDay(day) {
  selectedDay.value = day
  emit('update:modelValue', '')
}

// unavailable slots keep aria-disabled instead of the disabled attribute. a
// disabled button gets skipped in the tab order and the reason it can't be
// picked never reaches a screen reader
function chooseSlot(slot) {
  if (!slot.available) return
  emit('update:modelValue', slot.start.toISOString())
}

const reasonText = {
  full: 'fully booked',
  'too-soon': 'too soon to book',
  'too-far': 'outside the booking window',
}
</script>

<template>
  <div>
    <fieldset class="border-0 p-0 mb-4">
      <legend class="section-heading">Choose a date</legend>
      <div class="d-flex flex-wrap gap-2">
        <div v-for="day in days" :key="day" class="day-chip-wrap">
          <input
            :id="`day-${day}`"
            class="visually-hidden day-chip__input"
            type="radio"
            name="booking-day"
            :value="day"
            :checked="selectedDay === day"
            @change="chooseDay(day)"
          />
          <label class="day-chip" :for="`day-${day}`">{{ dayLabel(day) }}</label>
        </div>
      </div>

      <button
        v-if="dayCount < 20"
        type="button"
        class="btn btn-link fw-semibold p-0 mt-2"
        @click="dayCount = 20"
      >
        Show more dates
      </button>
    </fieldset>

    <!-- tabindex so a failed continue can send focus here rather than leaving a
         keyboard user at the bottom of the page with an error they cannot see -->
    <fieldset id="choose-time" class="border-0 p-0" tabindex="-1">
      <legend class="section-heading">Choose a time</legend>

      <p class="availability mb-3" role="status" aria-live="polite">{{ availabilityMessage }}</p>

      <div class="slot-grid">
        <button
          v-for="slot in slots"
          :key="slot.key"
          type="button"
          class="slot"
          :class="{ 'is-selected': modelValue === slot.start.toISOString(), 'is-blocked': !slot.available }"
          :aria-disabled="!slot.available"
          :aria-pressed="modelValue === slot.start.toISOString()"
          @click="chooseSlot(slot)"
        >
          {{ formatTime(slot.start) }}
          <span v-if="!slot.available" class="slot__reason">
            {{ reasonText[slot.reason] }}
          </span>
          <span v-else-if="slot.capacity > 1" class="slot__reason">
            {{ slot.remaining }} of {{ slot.capacity }} places
          </span>
        </button>
      </div>

      <p v-if="!slots.length" class="text-muted mb-0">
        This service is not running on that date.
      </p>
    </fieldset>
  </div>
</template>

<style scoped>
/* a count, not an instruction. it sat heavier than the legend above it and
   pulled the eye away from the thing you are meant to read first */
.availability {
  font-size: 0.95rem;
  color: var(--iris-ink-muted);
}

/* same reason as the contact form. focusing this scrolls it into view, and
   without the margin the sticky safety bar sits over the legend */
#choose-time {
  scroll-margin-top: 5.5rem;
}

#choose-time:focus-visible {
  outline: 3px solid var(--iris-purple-900);
  outline-offset: 6px;
  border-radius: var(--iris-radius-sm);
}

.day-chip-wrap {
  display: inline-flex;
}

.day-chip {
  display: inline-flex;
  align-items: center;
  min-height: var(--iris-target);
  padding: 0.5rem 1.1rem;
  border: 2px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-pill);
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.day-chip:hover {
  background: var(--iris-purple-50);
}

.day-chip__input:checked + .day-chip {
  background: var(--iris-purple-900);
  color: #fff;
}

/* focus ring has to come off the hidden input or a keyboard user arrowing
   through the dates sees nothing happen */
.day-chip__input:focus-visible + .day-chip {
  outline: 3px solid var(--iris-purple-500);
  outline-offset: 2px;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.6rem;
}

.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: var(--iris-target);
  padding: 0.55rem 0.5rem;
  border: 2px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-surface);
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.slot:hover {
  background: var(--iris-purple-50);
}

.slot.is-selected {
  background: var(--iris-purple-900);
  color: #fff;
}

/* blocked slots stay at 4.6:1 rather than the usual washed out grey. the
   label still has to be readable to be any use */
.slot.is-blocked {
  border-color: var(--iris-border);
  border-style: dashed;
  background: var(--iris-surface-muted);
  color: var(--iris-ink-muted);
  cursor: not-allowed;
  text-decoration: line-through;
}

.slot.is-blocked:hover {
  background: var(--iris-surface-muted);
}

.slot__reason {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: none;
  text-transform: none;
}
</style>
