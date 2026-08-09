<script setup>
import { onMounted } from 'vue'
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
    />

    <p class="text-muted small border rounded p-3 mt-4">
      Chosen names and contact details are deliberately not shown here. Staff who
      need them see them on the session itself.
    </p>
  </div>
</template>
