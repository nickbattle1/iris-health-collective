import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as adminService from '@/services/adminService'
import * as reviewService from '@/services/reviewService'
import { fetchPublishedProviders } from '@/services/providerService'

/* one store behind the three staff screens, because the tables and the charts
   read the same three collections and loading them per route would fetch the
   same bookings three times in a session. */

export const useAdminStore = defineStore('admin', () => {
  const bookings = ref([])
  const providers = ref([])
  const pending = ref([])
  const loading = ref(false)
  const error = ref('')

  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = ''
    try {
      const [b, p, r] = await Promise.all([
        adminService.fetchAllBookings(),
        fetchPublishedProviders(),
        reviewService.fetchReviewsByStatus('pending'),
      ])
      bookings.value = b
      providers.value = p
      pending.value = r
      loaded.value = true
    } catch (err) {
      error.value = 'We could not load the dashboard data. Check you are signed in as staff.'
      console.error('[admin] load', err)
    } finally {
      loading.value = false
    }
  }

  /* the row leaves the queue straight away rather than after a refetch. the
     trigger that recalculates the provider average takes a second or two, and
     watching a row sit there in the meantime looks like a failure */
  async function moderate(review, decision) {
    await reviewService.moderateReview({
      providerId: review.providerId,
      reviewId: review.id,
      decision,
    })
    pending.value = pending.value.filter((item) => item.id !== review.id)
  }

  const confirmedBookings = computed(() => bookings.value.filter((b) => b.status === 'confirmed'))

  // bookings per week, oldest first, for the trend chart
  const bookingsByWeek = computed(() => {
    const weeks = new Map()
    for (const booking of confirmedBookings.value) {
      if (!booking.startAt) continue
      const monday = new Date(booking.startAt)
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      const key = monday.toISOString().slice(0, 10)
      weeks.set(key, (weeks.get(key) ?? 0) + 1)
    }
    return [...weeks.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  })

  const bookingsByService = computed(() => {
    const counts = new Map()
    for (const booking of confirmedBookings.value) {
      counts.set(booking.serviceName, (counts.get(booking.serviceName) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  })

  const providersByBasis = computed(() => {
    const counts = new Map()
    for (const provider of providers.value) {
      const basis = provider.inclusionBasis ?? 'charity-verified'
      counts.set(basis, (counts.get(basis) ?? 0) + 1)
    }
    return [...counts.entries()]
  })

  return {
    bookings, providers, pending, loading, error,
    confirmedBookings, bookingsByWeek, bookingsByService, providersByBasis,
    load, moderate,
  }
})
