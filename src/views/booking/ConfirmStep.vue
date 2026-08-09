<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatTime } from '@/lib/timezone'
import { MODALITIES } from '@/lib/schemas'

// step 3. answers the A1 feedback about confirmation being a nav item rather
// than a workflow step: it has a URL but the router only lets you in holding a
// booking.
//
// the email line updates itself. the PDF goes out on a firestore trigger that
// finishes a second or two after this renders, so the page listens to its own
// booking doc instead of asking anyone to refresh

const store = useBookingStore()
const auth = useAuthStore()
const router = useRouter()
const { lastBooking } = storeToRefs(store)

const cancelling = ref(false)
const cancelError = ref('')
const claimError = ref('')
const claimed = ref(false)
let stop = () => {}

/* take a token off the anonymous session before leaving, then come straight
   back here. registering links the credential so the uid never changes and
   there is nothing to move. signing into an account you already had cannot
   link, so the token gets handed to claimBooking on the way back. */
async function goToAuth(name) {
  await store.beginClaim()
  router.push({ name, query: { redirect: '/book/confirm' } })
}

const booking = computed(() => lastBooking.value)
const isCancelled = computed(() => booking.value?.status === 'cancelled')

const emailLine = computed(() => {
  const status = booking.value?.emailStatus
  if (status === 'sent') return 'Your PDF confirmation has been emailed.'
  if (status === 'queued') return 'Preparing your PDF confirmation...'
  if (status === 'failed') return 'We could not send the email. Your booking is still confirmed.'
  return ''
})

async function cancel() {
  cancelError.value = ''
  cancelling.value = true
  try {
    await store.cancel(booking.value.id)
  } catch (err) {
    cancelError.value = err?.message ?? 'We could not cancel that. Please try again.'
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  /* the claim runs before the watcher, not after. until it lands the booking
     still carries the anonymous uid, so a listener opened now would be denied
     by the ownership rule and torn down a second later */
  if (auth.isAuthenticated && store.pendingClaim) {
    try {
      await store.finishClaim()
      claimed.value = true
    } catch (err) {
      claimError.value =
        err?.message ?? 'We could not move that booking. Your reference still works.'
    }
  }

  stop = store.watchLast()
})

onBeforeUnmount(() => stop())
</script>

<template>
  <div v-if="booking">
    <div class="text-center mb-4">
      <span class="tick" :class="{ 'tick--off': isCancelled }" aria-hidden="true">
        <i class="bi" :class="isCancelled ? 'bi-x-lg' : 'bi-check-lg'"></i>
      </span>
      <h2 class="h3 mt-3 mb-1">
        {{ isCancelled ? 'Booking cancelled' : 'Booking confirmed' }}
      </h2>
      <p class="text-muted mb-0">Reference {{ booking.reference }}</p>
    </div>

    <dl class="detail-card">
      <div>
        <dt>Session</dt>
        <dd>{{ booking.serviceName }} with {{ booking.practitionerName }}</dd>
      </div>
      <div>
        <dt>When</dt>
        <dd>
          {{ formatDate(booking.startAt) }}, {{ formatTime(booking.startAt) }}
          to {{ formatTime(booking.endAt) }}
        </dd>
      </div>
      <div>
        <dt>How</dt>
        <dd>{{ MODALITIES[booking.modality] ?? booking.modality }}</dd>
      </div>
      <div>
        <dt>Where</dt>
        <dd>{{ booking.location }}</dd>
      </div>
      <div>
        <dt>We will call you</dt>
        <dd>{{ booking.chosenName }}<template v-if="booking.pronouns"> ({{ booking.pronouns }})</template></dd>
      </div>
    </dl>

    <div v-if="!isCancelled" class="privacy-card mb-4">
      <p class="fw-bold mb-2">
        <i class="bi bi-shield-check" aria-hidden="true"></i>
        {{ booking.discreetReminder ? 'Discreet reminders are on' : 'Full detail reminders are on' }}
      </p>
      <ul class="mb-0 small">
        <li v-if="booking.discreetReminder">
          A reminder shows the date and time only. No service name and no organisation name.
        </li>
        <li v-else>Reminders include the service and practitioner name.</li>
        <li v-if="emailLine" role="status" aria-live="polite">{{ emailLine }}</li>
        <li v-else>No contact details were stored, because you did not ask for a reminder.</li>
        <li>You can cancel or change this booking at any time.</li>
      </ul>
    </div>

    <div v-if="!isCancelled" class="mb-4">
      <button type="button" class="btn btn-link fw-semibold p-0" :disabled="cancelling" @click="cancel">
        {{ cancelling ? 'Cancelling...' : 'Cancel this booking' }}
      </button>
    </div>

    <p v-if="cancelError" class="alert alert-danger" role="alert">{{ cancelError }}</p>

    <div v-if="!auth.isAuthenticated" class="alert alert-light border">
      <p class="fw-bold mb-1">Want to manage this later?</p>
      <p class="small mb-2">
        You booked without an account, which is fine. Either option below keeps
        this booking and brings you straight back here, so you can reschedule
        from any device. Nothing you have entered is lost.
      </p>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn-iris-outline" @click="goToAuth('register')">
          Create an account
        </button>
        <button type="button" class="btn-iris-outline" @click="goToAuth('login')">
          I already have one
        </button>
      </div>
    </div>

    <p v-if="claimError" class="alert alert-danger mt-3" role="alert">{{ claimError }}</p>
    <p v-if="claimed" class="alert alert-success mt-3" role="status">
      This booking is now saved to your account.
    </p>

    <div class="d-flex flex-wrap gap-2 mt-4">
      <RouterLink to="/" class="btn-iris">Back to home</RouterLink>
      <RouterLink v-if="auth.isAuthenticated" to="/account" class="btn-iris-outline">
        My bookings
      </RouterLink>
    </div>

    <p class="text-muted small mt-4 mb-0">Support is available if plans change.</p>
  </div>
</template>

<style scoped>
.tick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--iris-purple-900);
  color: #fff;
  font-size: 2.4rem;
}

.tick--off {
  background: var(--iris-ink-muted);
}

.detail-card {
  display: grid;
  gap: 0.9rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.detail-card dt {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--iris-ink-muted);
}

.detail-card dd {
  margin: 0.15rem 0 0;
  font-weight: 600;
}

.privacy-card {
  padding: 1rem 1.15rem;
  border: 1px solid var(--iris-purple-100);
  border-radius: var(--iris-radius-md);
  background: var(--iris-purple-50);
}
</style>
