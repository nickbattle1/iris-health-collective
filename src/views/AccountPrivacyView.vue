<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toCsv, downloadCsv } from '@/lib/csv'

/* renamed from "Delete my data" after A1 feedback. that label described one
   action rather than the section, so it sits here as a sub action alongside
   reminder settings and the data download. */

const auth = useAuthStore()
const router = useRouter()

const confirmText = ref('')
const deleting = ref(false)
const reminderPrefs = ref(auth.profile?.reminderPrefs ?? 'discreet')

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
      <p class="mb-2">
        This removes your profile and signs you out permanently. It cannot be undone.
        Bookings you have already made are kept without your name attached, because
        the practitioner still needs to know the appointment exists.
      </p>

      <label for="confirm-delete" class="form-label fw-semibold">
        Type DELETE to confirm
      </label>
      <input
        id="confirm-delete"
        v-model="confirmText"
        class="form-control mb-3"
        style="max-width: 12rem"
        autocomplete="off"
      />

      <p v-if="auth.error" class="alert alert-danger" role="alert">{{ auth.error }}</p>

      <button
        type="button"
        class="btn btn-danger"
        :disabled="confirmText !== 'DELETE' || deleting"
        @click="destroyAccount"
      >
        {{ deleting ? 'Deleting...' : 'Delete my account' }}
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
</style>
