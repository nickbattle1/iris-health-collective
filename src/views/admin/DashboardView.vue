<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import { useAdminStore } from '@/stores/admin'
import { useZodForm } from '@/composables/useZodForm'
import { roleRequestSchema } from '@/lib/schemas'
import { setUserRole } from '@/services/adminService'
import { INCLUSION_BASIS } from '@/constants/badges'
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'

/* charts on live firestore data, plus the one screen that calls setUserRole.

   chart.js is tree shaken, so only the pieces these three charts use get
   registered. pulling in the whole library for a bar and a doughnut costs
   about 60kb of bundle for nothing. */
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const store = useAdminStore()
const { bookingsByWeek, bookingsByService, providersByBasis, providers, loading, error } =
  storeToRefs(store)

const PURPLE = '#522e63'
const PALETTE = ['#522e63', '#8e5fa8', '#c9a3d9', '#d94f7d']

// charts are decoration for a screen reader, the summary line above each one
// carries the same numbers in text
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}

const weekChart = computed(() => ({
  labels: bookingsByWeek.value.map(([week]) =>
    new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
  ),
  datasets: [{ label: 'Bookings', data: bookingsByWeek.value.map(([, n]) => n), backgroundColor: PURPLE }],
}))

const serviceChart = computed(() => ({
  labels: bookingsByService.value.map(([name]) => name),
  datasets: [
    { label: 'Bookings', data: bookingsByService.value.map(([, n]) => n), backgroundColor: PALETTE },
  ],
}))

const basisChart = computed(() => ({
  labels: providersByBasis.value.map(([basis]) => INCLUSION_BASIS[basis] ?? basis),
  datasets: [{ data: providersByBasis.value.map(([, n]) => n), backgroundColor: PALETTE }],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
}

const totalBookings = computed(() => store.confirmedBookings.length)

const roleSaved = ref('')
const form = useZodForm(roleRequestSchema, { email: '', role: 'provider' })
const { values, errors, summary, submitting } = form

const roleOptions = [
  { value: 'member', label: 'Community member' },
  { value: 'provider', label: 'Provider' },
  { value: 'admin', label: 'Charity staff' },
]

async function saveRole() {
  roleSaved.value = ''
  const result = await form.handleSubmit(async (payload) => {
    await setUserRole(payload)
    roleSaved.value = `${payload.email} is now set to ${payload.role}.`
  })
  if (result.ok) form.reset()
}

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Staff dashboard</h1>
    <p class="hero-lead mb-4">Live figures from bookings and the directory.</p>

    <AdminNav />

    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>

    <div class="stat-row mb-4">
      <div class="stat">
        <span class="stat__value">{{ totalBookings }}</span>
        <span class="stat__label">confirmed bookings</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ providers.length }}</span>
        <span class="stat__label">published listings</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ store.pending.length }}</span>
        <span class="stat__label">reviews awaiting a decision</span>
      </div>
    </div>

    <section class="chart-card mb-4" aria-labelledby="chart-weeks">
      <h2 id="chart-weeks" class="h5 mb-1">Bookings per week</h2>
      <p class="text-muted small mb-3">
        {{ bookingsByWeek.length }} weeks with a confirmed session.
      </p>
      <div class="chart-card__canvas">
        <Bar v-if="bookingsByWeek.length" :data="weekChart" :options="baseOptions" />
        <p v-else class="text-muted mb-0">No bookings yet.</p>
      </div>
    </section>

    <div class="chart-pair mb-4">
      <section class="chart-card" aria-labelledby="chart-services">
        <h2 id="chart-services" class="h5 mb-1">Demand by service</h2>
        <p class="text-muted small mb-3">
          Which of our own sessions people are actually booking.
        </p>
        <div class="chart-card__canvas">
          <Bar v-if="bookingsByService.length" :data="serviceChart" :options="baseOptions" />
          <p v-else class="text-muted mb-0">No bookings yet.</p>
        </div>
      </section>

      <section class="chart-card" aria-labelledby="chart-basis">
        <h2 id="chart-basis" class="h5 mb-1">How listings earned their place</h2>
        <p class="text-muted small mb-3">
          Accredited, community endorsed, or reviewed by our team.
        </p>
        <div class="chart-card__canvas">
          <Doughnut
            v-if="providersByBasis.length"
            :data="basisChart"
            :options="doughnutOptions"
          />
          <p v-else class="text-muted mb-0" aria-busy="true">Loading...</p>
        </div>
      </section>
    </div>

    <section class="role-card" aria-labelledby="roles">
      <h2 id="roles" class="h5 mb-1">Change someone's role</h2>
      <p class="text-muted small mb-3">
        Sets the custom claim on their account. They need to sign out and back in
        for it to take effect.
      </p>

      <p v-if="roleSaved" class="alert alert-success" role="status">{{ roleSaved }}</p>
      <ErrorSummary id="error-summary" :errors="summary" />

      <form novalidate @submit.prevent="saveRole">
        <BaseField
          id="email"
          v-model="values.email"
          label="Account email"
          type="email"
          autocomplete="off"
          required
          :error="errors.email"
          @blur="form.touch('email')"
        />

        <BaseSelect
          id="role"
          v-model="values.role"
          label="Role"
          :options="roleOptions"
          required
          :error="errors.role"
          @blur="form.touch('role')"
        />

        <button type="submit" class="btn-iris" :disabled="submitting">
          {{ submitting ? 'Saving...' : 'Set role' }}
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.stat-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.stat {
  padding: 1.15rem;
  border-radius: var(--iris-radius-md);
  background: var(--iris-purple-900);
  color: #fff;
}

.stat__value {
  display: block;
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.1;
}

.stat__label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.chart-card,
.role-card {
  padding: 1.25rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
}

/* chart.js needs a sized parent or the canvas grows on every resize */
.chart-card__canvas {
  position: relative;
  height: 260px;
}

.chart-pair {
  display: grid;
  gap: 1rem;
}

@media (min-width: 992px) {
  .chart-pair {
    grid-template-columns: 1fr 1fr;
  }
}

.role-card {
  background: var(--iris-surface-muted);
  max-width: 32rem;
}
</style>
