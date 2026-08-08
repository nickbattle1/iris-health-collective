<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/admin'
import AdminNav from '@/components/admin/AdminNav.vue'
import DataTable from '@/components/admin/DataTable.vue'
import { formatDate } from '@/lib/timezone'

/* the moderation queue. table one of two for D.3.

   every review waits here before it counts toward a provider's average. that
   is the whole reason the aggregate is trustworthy: a practice cannot write
   its own rating and nobody outside staff can approve one. */

const store = useAdminStore()
const { pending, loading, error } = storeToRefs(store)

const working = ref('')
const actionError = ref('')

const columns = [
  { key: 'providerId', label: 'Practice' },
  { key: 'rating', label: 'Rating' },
  { key: 'comment', label: 'Comment', format: (v) => v || 'Rating only' },
  { key: 'displayName', label: 'Name given', format: (v) => v || 'Not given' },
  {
    key: 'createdAt',
    label: 'Submitted',
    format: (value) => (value ? formatDate(value) : 'Just now'),
  },
]

async function decide(review, decision) {
  actionError.value = ''
  working.value = review.id
  try {
    await store.moderate(review, decision)
  } catch (err) {
    actionError.value = err?.message ?? 'We could not save that decision.'
  } finally {
    working.value = ''
  }
}

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Review queue</h1>
    <p class="hero-lead mb-4">
      Reviews waiting on a decision. Only approved reviews count toward a
      practice's rating.
    </p>

    <AdminNav />

    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <p v-if="actionError" class="alert alert-danger" role="alert">{{ actionError }}</p>

    <DataTable
      :rows="pending"
      :columns="columns"
      :loading="loading"
      caption="Reviews awaiting moderation, filterable by column"
      export-name="pending-reviews"
      empty-text="Nothing waiting. New reviews appear here as they are submitted."
    >
      <template #actions="{ row }">
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-sm btn-dark"
            :disabled="working === row.id"
            @click="decide(row, 'approved')"
          >
            Approve<span class="visually-hidden"> review of {{ row.providerId }}</span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :disabled="working === row.id"
            @click="decide(row, 'rejected')"
          >
            Reject<span class="visually-hidden"> review of {{ row.providerId }}</span>
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>
