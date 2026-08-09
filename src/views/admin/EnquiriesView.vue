<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/admin'
import { ENQUIRY_TOPICS } from '@/lib/schemas'
import AdminNav from '@/components/admin/AdminNav.vue'
import DataTable from '@/components/admin/DataTable.vue'
import { formatDate, formatTime } from '@/lib/timezone'

/* everything written to us, in one place.

   contact, feedback, complaints, volunteering, listing applications, event
   registrations and donations all land in the same collection with a topic on
   them, so this is one table rather than six. filter the topic column to see
   just complaints, or just donations, and export what is left.

   an enquiry with no email is anonymous on purpose. the contact page promises
   you can write without saying who you are, so the column says "anonymous"
   rather than looking like data went missing. */

const store = useAdminStore()
const { enquiries, loading, error } = storeToRefs(store)

const topicLabel = Object.fromEntries(ENQUIRY_TOPICS.map((t) => [t.value, t.label]))

const columns = [
  { key: 'topic', label: 'About', format: (value) => topicLabel[value] ?? value },
  { key: 'message', label: 'Message' },
  { key: 'name', label: 'From', format: (value) => value || 'Not given' },
  { key: 'email', label: 'Reply to', format: (value) => value || 'Anonymous' },
  {
    key: 'createdAt',
    label: 'Received',
    format: (value) => (value ? `${formatDate(value)}, ${formatTime(value)}` : 'Just now'),
  },
]

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Enquiries</h1>
    <p class="hero-lead mb-4">
      Everything sent through the contact, volunteer, listing, event and donation
      forms. Filter the About column to see one kind.
    </p>

    <AdminNav />

    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>

    <DataTable
      :rows="enquiries"
      :columns="columns"
      :loading="loading"
      :page-size="15"
      caption="Enquiries received, filterable by column"
      export-name="enquiries"
      empty-text="Nothing has come in yet."
    />

    <p class="text-muted small border rounded p-3 mt-4">
      Anyone can write to us without an account and without leaving contact
      details. An enquiry showing Anonymous cannot be replied to, which is the
      point rather than a fault.
    </p>
  </div>
</template>
