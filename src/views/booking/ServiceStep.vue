<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBookingStore } from '@/stores/booking'
import ServicePicker from '@/components/booking/ServicePicker.vue'
import SlotCalendar from '@/components/booking/SlotCalendar.vue'
import { formatDate, formatTime } from '@/lib/timezone'

const store = useBookingStore()
const router = useRouter()
const { services, service, serviceId, startAt, availability, loading, error } = storeToRefs(store)

const chosen = computed(() => (startAt.value ? new Date(startAt.value) : null))

/* continue stays clickable with nothing picked. a disabled button cannot be
   focused or pressed, so it can never tell you what it is waiting for, and the
   only feedback was a line of grey text you had already scrolled past */
const attempted = ref(false)

function onServiceChange(id) {
  store.selectService(id)
}

function onSlotChange(iso) {
  store.selectSlot(iso)
}

// the moment they pick one the complaint is stale
watch(
  () => store.hasSelection,
  (ok) => {
    if (ok) attempted.value = false
  },
)

async function next() {
  if (store.hasSelection) {
    router.push({ name: 'book-details' })
    return
  }

  // pull the alert and put it back, so a second press announces again instead
  // of the silence that made this feel broken in the first place
  attempted.value = false
  await nextTick()
  attempted.value = true
  await nextTick()

  document.getElementById('choose-time')?.focus()
}

onMounted(() => store.loadServices())
</script>

<template>
  <div>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>

    <div v-if="loading" class="text-muted py-4" aria-busy="true">
      <i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading available sessions...
    </div>

    <template v-else-if="services.length">
      <ServicePicker
        :services="services"
        :model-value="serviceId"
        @update:model-value="onServiceChange"
      />

      <SlotCalendar
        v-if="service"
        :service="service"
        :taken="availability"
        :model-value="startAt"
        @update:model-value="onSlotChange"
      />

      <div class="sticky-actions">
        <!-- a separate element rather than a role swap on the line below. an
             alert is only announced when it appears, so it has to be new -->
        <p v-if="attempted" class="slot-required mb-2" role="alert">
          <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
          Please select a time to continue
        </p>
        <p v-else class="mb-2 fw-semibold" role="status" aria-live="polite">
          <template v-if="chosen">
            Selected: {{ formatDate(chosen) }} at {{ formatTime(chosen) }}
          </template>
          <template v-else>Choose a time to continue</template>
        </p>
        <button type="button" class="btn-iris w-100" @click="next">
          Continue to your details
        </button>
      </div>
    </template>

    <p v-else class="text-muted">
      No sessions are open for booking right now. Please check back soon, or
      <RouterLink to="/directory">find an affirming provider</RouterLink> instead.
    </p>
  </div>
</template>

<style scoped>
.slot-required {
  color: var(--iris-danger);
  font-weight: 700;
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  padding: 1rem 0 0.75rem;
  margin-top: 1.5rem;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), var(--iris-surface) 35%);
}
</style>
