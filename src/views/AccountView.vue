<script setup>
import { ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseField from '@/components/ui/BaseField.vue'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ displayName: '', pronouns: '' })
const saved = ref(false)
const verifySent = ref(false)

/* watched rather than read once on mount. signing in navigates here straight
   away, while the profile read is still in flight, so a one-off read lands
   before the data does. immediate covers the refresh case where it is already
   there. */
watch(
  () => auth.profile,
  (profile) => {
    form.value.displayName = profile?.displayName ?? auth.displayName
    form.value.pronouns = profile?.pronouns ?? ''
  },
  { immediate: true },
)

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
  } catch {}
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
      <h2 id="bookings" class="h5 mb-2">Upcoming bookings</h2>
      <p class="text-muted mb-0">
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
