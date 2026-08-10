<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/admin'
import AdminNav from '@/components/admin/AdminNav.vue'
import DataTable from '@/components/admin/DataTable.vue'
import { formatDate, formatTime } from '@/lib/timezone'

/* table two of two. the export here is the one a coordinator would actually
   use: filter to next week, export, take it to the practitioners' meeting.

   the columns are deliberately thin. a booking holds a chosen name and
   sometimes a contact detail, and none of that needs to be on a screen a
   volunteer might be standing behind. */

const store = useAdminStore()
const { bookings, loading, error } = storeToRefs(store)

const columns = [
  { key: 'reference', label: 'Reference', filter: 'text' },
  { key: 'serviceName', label: 'Service' },
  { key: 'practitionerName', label: 'Practitioner' },
  {
    key: 'startAt',
    label: 'When',
    format: (value) => (value ? `${formatDate(value)}, ${formatTime(value)}` : ''),
  },
  { key: 'status', label: 'Status' },
  { key: 'emailStatus', label: 'Confirmation' },
]

const working = ref('')
const actionError = ref('')

/* cancelling here goes through the same callable a member uses on their own
   booking. the function reads the caller's role claim and lets staff cancel
   anyone's, which is what happens when somebody rings up rather than doing it
   themselves. the transaction releases the slot either way. */
async function cancel(booking) {
  actionError.value = ''
  working.value = booking.id
  try {
    await store.cancel(booking)
  } catch (err) {
    actionError.value = err?.message ?? 'We could not cancel that booking.'
  } finally {
    working.value = ''
  }
}

const isPast = (booking) => !booking.startAt || booking.startAt < new Date()

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Bookings</h1>
    <p class="hero-lead mb-4">
      Every session booked through the site. Filter by any column, then export
      what is left.
    </p>

    <AdminNav />

    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <p v-if="actionError" class="alert alert-danger" role="alert">{{ actionError }}</p>

    <DataTable
      :rows="bookings"
      :columns="columns"
      :loading="loading"
      :page-size="15"
      date-key="startAt"
      date-label="session date"
      caption="All bookings, filterable by column and reporting period"
      export-name="bookings"
      empty-text="No bookings yet."
    >
      <template #actions="{ row }">
        <span v-if="row.status === 'cancelled'" class="text-muted small">Cancelled</span>
        <span v-else-if="isPast(row)" class="text-muted small">Session passed</span>
        <button
          v-else
          type="button"
          class="btn btn-sm btn-outline-danger"
          :disabled="working === row.id"
          @click="cancel(row)"
        >
          {{ working === row.id ? 'Cancelling...' : 'Cancel' }}
          <span class="visually-hidden">
            booking {{ row.reference }}, {{ row.serviceName }}
          </span>
        </button>
      </template>
    </DataTable>

    <p class="text-muted small border rounded p-3 mt-4">
      Chosen names and contact details are deliberately not shown here. Staff who
      need them see them on the session itself.
    </p>
  </div>
</template>
