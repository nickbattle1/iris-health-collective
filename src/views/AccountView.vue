<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseField from '@/components/ui/BaseField.vue'

const auth = useAuthStore()

const form = ref({ displayName: '', pronouns: '' })
const saved = ref(false)

onMounted(() => {
  form.value.displayName = auth.profile?.displayName ?? auth.displayName
  form.value.pronouns = auth.profile?.pronouns ?? ''
})

async function save() {
  await auth.updateProfileFields({ ...form.value })
  saved.value = true
  window.setTimeout(() => (saved.value = false), 4000)
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

    <section class="mb-5" aria-labelledby="details">
      <h2 id="details" class="h5 mb-3">How we address you</h2>

      <p v-if="saved" class="alert alert-success" role="status">Your details are saved.</p>

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

    <button type="button" class="btn btn-link p-0" @click="auth.logout">Sign out</button>
  </div>
</template>
