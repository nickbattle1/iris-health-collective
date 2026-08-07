<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import BaseField from '@/components/ui/BaseField.vue'
import { formatDate, formatTime } from '@/lib/timezone'

const auth = useAuthStore()
const booking = useBookingStore()
const router = useRouter()
const { upcoming, loadingMine } = storeToRefs(booking)

const form = ref({ displayName: '', pronouns: '' })
const saved = ref(false)
const verifySent = ref(false)
const cancellingId = ref('')
const cancelError = ref('')

// watched, not read once on mount. signing in lands you here while the profile
// read is still in flight, so a one off read gets there before the data does.
// immediate covers the refresh case where it's already loaded
watch(
  () => auth.profile,
  (profile) => {
    form.value.displayName = profile?.displayName ?? auth.displayName
    form.value.pronouns = profile?.pronouns ?? ''
  },
  { immediate: true },
)

onMounted(() => booking.loadMyBookings())

async function save() {
  saved.value = false
  try {
    await auth.updateProfileFields({ ...form.value })
    saved.value = true
    window.setTimeout(() => (saved.value = false), 4000)
  } catch {
    // the store holds the message, the alert below renders it
  }
}

async function resend() {
  try {
    await auth.resendVerification()
    verifySent.value = true
  } catch {
    // the store holds the message
  }
}

// cancel goes through a callable, not a firestore write. the client can't edit
// a booking at all: the transaction that took the slot has to be the one that
// gives it back
async function cancel(id) {
  cancelError.value = ''
  cancellingId.value = id
  try {
    await booking.cancel(id)
  } catch (err) {
    cancelError.value = err?.message ?? 'We could not cancel that. Please try again.'
  } finally {
    cancellingId.value = ''
  }
}

async function signOut() {
  await auth.logout()
  router.push('/')
}

const roleLabel = { member: 'Community member', provider: 'Provider', admin: 'Charity staff' }
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 620px">
    <h1 class="mb-2">My account</h1>
    <p class="hero-lead mb-4">Signed in as {{ auth.user?.email }}</p>

    <p class="mb-4">
      <span class="badge text-bg-light border">{{ roleLabel[auth.role] }}</span>
    </p>

    <div v-if="auth.user && !auth.isVerified" class="alert alert-warning" role="status">
      <p class="fw-bold mb-1">Your email address is not confirmed</p>
      <p class="mb-2 small">
        You can use everything without confirming. Confirming means we can help
        if you ever lose access to this account.
      </p>
      <button v-if="!verifySent" type="button" class="btn btn-sm btn-dark" @click="resend">
        Send the confirmation email again
      </button>
      <p v-else class="mb-0 small">Sent. Check your inbox and spam folder.</p>
    </div>

    <section class="mb-5" aria-labelledby="details">
      <h2 id="details" class="h5 mb-3">How we address you</h2>

      <p v-if="saved" class="alert alert-success" role="status">Your details are saved.</p>
      <p v-if="auth.error" class="alert alert-danger" role="alert">{{ auth.error }}</p>

      <form novalidate @submit.prevent="save">
        <BaseField
          v-model="form.displayName"
          label="Chosen name"
          hint="This is the only name we use in reminders and at reception."
          required
        />

        <BaseField
          v-model="form.pronouns"
          label="Pronouns"
          hint="Self describe, or leave blank. We share this with the practitioner so they get it right the first time."
          placeholder="for example: they/them"
        />

        <button type="submit" class="btn-iris" :disabled="auth.loading">
          {{ auth.loading ? 'Saving...' : 'Save changes' }}
        </button>
      </form>
    </section>

    <section class="mb-5" aria-labelledby="bookings">
      <h2 id="bookings" class="h5 mb-3">Upcoming bookings</h2>

      <p v-if="cancelError" class="alert alert-danger" role="alert">{{ cancelError }}</p>

      <p v-if="loadingMine" class="text-muted mb-0" aria-busy="true">Loading your bookings...</p>

      <template v-else-if="upcoming.length">
        <article v-for="item in upcoming" :key="item.id" class="booking-row">
          <div>
            <p class="fw-bold mb-1">{{ item.serviceName }}</p>
            <p class="mb-1 small">
              {{ formatDate(item.startAt) }}, {{ formatTime(item.startAt) }}
              with {{ item.practitionerName }}
            </p>
            <p class="mb-0 text-muted small">Reference {{ item.reference }}</p>
          </div>
          <button
            type="button"
            class="btn btn-link fw-semibold p-0 text-nowrap"
            :disabled="cancellingId === item.id"
            @click="cancel(item.id)"
          >
            {{ cancellingId === item.id ? 'Cancelling...' : 'Cancel' }}
            <span class="visually-hidden">
              {{ item.serviceName }} on {{ formatDate(item.startAt) }}
            </span>
          </button>
        </article>
      </template>

      <p v-else class="text-muted mb-0">
        You have no upcoming bookings.
        <RouterLink to="/book">Book a session</RouterLink>
      </p>
    </section>

    <section aria-labelledby="privacy">
      <h2 id="privacy" class="h5 mb-2">Privacy and data</h2>
      <p class="mb-3">
        Download everything we hold about you, change how reminders reach you,
        or delete your account.
      </p>
      <RouterLink to="/account/privacy" class="btn-iris-outline">
        Privacy and data
      </RouterLink>
    </section>

    <hr class="my-5" />

    <button type="button" class="btn btn-link p-0" @click="signOut">Sign out</button>
  </div>
</template>

<style scoped>
.booking-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}
</style>
