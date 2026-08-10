<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toCsv, downloadCsv } from '@/lib/csv'

/* renamed from "Delete my data" after A1 feedback. that label described one
   action rather than the section, so it sits here as a sub action alongside
   reminder settings and the data download. */

const auth = useAuthStore()
const router = useRouter()

const deleting = ref(false)
const confirmingDelete = ref(false)
const confirmButton = ref(null)
const reminderPrefs = ref(auth.profile?.reminderPrefs ?? 'discreet')

const resetting = ref(false)
const resetSent = ref(false)
const resetError = ref('')

/* a google account has no password to reset, so the button would send someone
   to wait on a mail that never comes. providerData is empty on a few restored
   sessions, so only hide it when we can positively see google on its own. */
const canResetPassword = computed(() => {
  if (!auth.user?.email) return false
  const providers = auth.user.providerData ?? []
  return providers.length === 0 || providers.some((p) => p.providerId === 'password')
})

function exportMyData() {
  const rows = [
    { field: 'Chosen name', value: auth.profile?.displayName ?? '' },
    { field: 'Pronouns', value: auth.profile?.pronouns ?? 'not given' },
    { field: 'Email', value: auth.user?.email ?? '' },
    { field: 'Reminder style', value: reminderPrefs.value },
    { field: 'Account type', value: auth.role },
  ]
  const csv = toCsv(rows, [
    { key: 'field', label: 'Field' },
    { key: 'value', label: 'Value' },
  ])
  downloadCsv('iris-my-data.csv', csv)
}

async function saveReminders() {
  await auth.updateProfileFields({ reminderPrefs: reminderPrefs.value })
}

/* the same mail the sign in screen sends. firebase hosts the reset page, so no
   password ever passes through us. */
async function sendPasswordReset() {
  resetting.value = true
  resetError.value = ''
  try {
    await auth.resetPassword(auth.user.email)
    resetSent.value = true
  } catch {
    // kept local, or the store error would also light up the delete section
    resetError.value = auth.error
    auth.clearError()
  } finally {
    resetting.value = false
  }
}

async function askToDelete() {
  confirmingDelete.value = true
  await nextTick()
  confirmButton.value?.focus()
}

async function destroyAccount() {
  deleting.value = true
  try {
    await auth.deleteAccount()
    router.push('/')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 620px">
    <RouterLink to="/account" class="fw-semibold d-inline-block mb-4">
      <i class="bi bi-chevron-left" aria-hidden="true"></i> Back to my account
    </RouterLink>

    <h1 class="mb-4">Privacy and data</h1>

    <section v-if="canResetPassword" class="mb-5" aria-labelledby="password">
      <h2 id="password" class="h5 mb-2">Password</h2>

      <p v-if="resetSent" class="alert alert-success mb-0" role="status">
        A reset link is on its way to {{ auth.user.email }}. Check your spam
        folder if it does not arrive in a few minutes.
      </p>

      <template v-else>
        <p class="mb-3">
          We will email a link to {{ auth.user.email }} so you can choose a new
          password. The one you have now keeps working until you do.
        </p>

        <p v-if="resetError" class="alert alert-danger" role="alert">{{ resetError }}</p>

        <button
          type="button"
          class="btn-iris-outline"
          :disabled="resetting"
          @click="sendPasswordReset"
        >
          {{ resetting ? 'Sending...' : 'Reset my password' }}
        </button>
      </template>
    </section>

    <section class="mb-5" aria-labelledby="reminders">
      <h2 id="reminders" class="h5 mb-3">Reminders</h2>

      <div class="form-check mb-2">
        <input
          id="discreet"
          v-model="reminderPrefs"
          class="form-check-input"
          type="radio"
          value="discreet"
        />
        <label class="form-check-label" for="discreet">
          <strong>Discreet</strong>
          <span class="d-block form-text mt-0">
            Date and time only. No service name, no organisation name.
          </span>
        </label>
      </div>

      <div class="form-check mb-2">
        <input id="full" v-model="reminderPrefs" class="form-check-input" type="radio" value="full" />
        <label class="form-check-label" for="full">
          <strong>Full detail</strong>
          <span class="d-block form-text mt-0">Include the service and practitioner.</span>
        </label>
      </div>

      <div class="form-check mb-3">
        <input id="none" v-model="reminderPrefs" class="form-check-input" type="radio" value="none" />
        <label class="form-check-label" for="none">
          <strong>None</strong>
          <span class="d-block form-text mt-0">Do not send reminders at all.</span>
        </label>
      </div>

      <button type="button" class="btn-iris-outline" @click="saveReminders">
        Save reminder settings
      </button>
    </section>

    <section class="mb-5" aria-labelledby="download">
      <h2 id="download" class="h5 mb-2">Download my data</h2>
      <p class="mb-3">Everything we hold about you, as a spreadsheet file.</p>
      <button type="button" class="btn-iris-outline" @click="exportMyData">
        <i class="bi bi-download" aria-hidden="true"></i> Download CSV
      </button>
    </section>

    <section class="danger-zone" aria-labelledby="delete">
      <h2 id="delete" class="h5 mb-2">Delete my account</h2>
      <p class="mb-3">
        This removes your profile and signs you out permanently. It cannot be undone.
        Bookings you have already made are kept without your name attached, because
        the practitioner still needs to know the appointment exists.
      </p>

      <p v-if="auth.error" class="alert alert-danger" role="alert">{{ auth.error }}</p>

      <div v-if="confirmingDelete">
        <p id="confirm-delete" class="fw-bold mb-3">
          Are you sure? There is no way back from this.
        </p>
        <div class="d-flex flex-wrap gap-2">
          <button
            ref="confirmButton"
            type="button"
            class="btn btn-danger"
            aria-describedby="confirm-delete"
            :disabled="deleting"
            @click="destroyAccount"
          >
            {{ deleting ? 'Deleting...' : 'Yes, delete my account' }}
          </button>
          <button
            type="button"
            class="btn-iris-outline"
            :disabled="deleting"
            @click="confirmingDelete = false"
          >
            Keep my account
          </button>
        </div>
      </div>

      <button v-else type="button" class="btn btn-danger" @click="askToDelete">
        Delete my account
      </button>
    </section>
  </div>
</template>

<style scoped>
.danger-zone {
  padding: 1.25rem;
  border: 2px solid var(--iris-danger);
  border-radius: var(--iris-radius-md);
}

/* bootstrap's danger button is shorter than the iris ones, which showed once
   it sat beside "Keep my account" */
.danger-zone .btn-danger {
  min-height: var(--iris-target);
  padding: 0.65rem 1.5rem;
  border-radius: var(--iris-radius-pill);
  font-weight: 700;
}
</style>
