import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as bookingService from '@/services/bookingService'
import { useAuthStore } from '@/stores/auth'

// wizard state for the three steps. lives here rather than in the view so the
// back button behaves and so the router guards can ask whether a step is
// reachable yet

export const useBookingStore = defineStore('booking', () => {
  const services = ref([])
  const loading = ref(false)
  const error = ref('')

  const serviceId = ref('')
  const startAt = ref('') // ISO string
  const availability = ref({}) // { slotKey: bookings taken }

  const submitting = ref(false)
  const lastBooking = ref(null)

  const myBookings = ref([])
  const loadingMine = ref(false)
  const pendingClaim = ref(null)

  const service = computed(() => services.value.find((s) => s.id === serviceId.value) ?? null)
  const hasSelection = computed(() => !!service.value && !!startAt.value)

  const upcoming = computed(() =>
    myBookings.value.filter((b) => b.status === 'confirmed' && b.startAt > new Date()),
  )

  async function loadServices() {
    if (services.value.length) return
    loading.value = true
    error.value = ''
    try {
      services.value = await bookingService.fetchServices()
      if (!serviceId.value && services.value.length) await selectService(services.value[0].id)
    } catch (err) {
      error.value = 'We could not load the available sessions. Please try again.'
      console.error('[booking] loadServices', err)
    } finally {
      loading.value = false
    }
  }

  async function selectService(id) {
    serviceId.value = id
    startAt.value = ''
    try {
      availability.value = await bookingService.fetchAvailability(id)
    } catch (err) {
      // not worth blocking a booking over. every slot shows open and the
      // transaction still decides
      availability.value = {}
      console.error('[booking] availability', err)
    }
  }

  function selectSlot(iso) {
    startAt.value = iso
  }

  // session only starts when someone is about to book, never on page load, so
  // browsing the directory leaves nothing behind
  async function ensureSession() {
    const auth = useAuthStore()
    if (!auth.user) await auth.continueAnonymously()
    return auth.user
  }

  async function submit(details) {
    submitting.value = true
    try {
      await ensureSession()
      const result = await bookingService.createBooking({
        serviceId: serviceId.value,
        startAt: startAt.value,
        details,
      })

      lastBooking.value = {
        ...result,
        startAt: new Date(result.startAt),
        endAt: new Date(result.endAt),
      }

      // mark the slot the transaction just took, so a second go in this tab
      // sees it gone without another read
      if (result.slotKey) {
        availability.value = {
          ...availability.value,
          [result.slotKey]: (availability.value[result.slotKey] ?? 0) + 1,
        }
      }

      return lastBooking.value
    } finally {
      submitting.value = false
    }
  }

  // the PDF email goes out on a trigger that finishes after this page has
  // rendered, so watch the doc. returns the unsubscribe
  function watchLast() {
    if (!lastBooking.value?.id) return () => {}
    return bookingService.watchBooking(lastBooking.value.id, (fresh) => {
      lastBooking.value = { ...lastBooking.value, ...fresh }
    })
  }

  /* linking works for a brand new account and keeps the uid, but firebase will
     not link a credential that already belongs to someone. so for an account
     you already had, take a token off the anonymous session before signing in
     and hand it to the function afterwards as proof. */
  async function beginClaim() {
    if (!lastBooking.value?.id) return
    const auth = useAuthStore()
    const previousToken = await auth.getIdToken()
    pendingClaim.value = previousToken ? { bookingId: lastBooking.value.id, previousToken } : null
  }

  async function finishClaim() {
    if (!pendingClaim.value) return
    const claim = pendingClaim.value
    pendingClaim.value = null
    await bookingService.claimBooking(claim)
    await loadMyBookings()
  }

  async function loadMyBookings() {
    const auth = useAuthStore()
    if (!auth.user) return
    loadingMine.value = true
    try {
      myBookings.value = await bookingService.fetchMyBookings(auth.user.uid)
    } catch (err) {
      console.error('[booking] loadMyBookings', err)
    } finally {
      loadingMine.value = false
    }
  }

  async function cancel(bookingId) {
    await bookingService.cancelBooking(bookingId)
    await loadMyBookings()
    if (lastBooking.value?.id === bookingId) lastBooking.value.status = 'cancelled'
  }

  // called on leaving the wizard so a stale selection can't follow you into a
  // new booking next week
  function reset() {
    startAt.value = ''
    lastBooking.value = null
    pendingClaim.value = null
  }

  return {
    services,
    loading,
    error,
    serviceId,
    startAt,
    availability,
    submitting,
    lastBooking,
    myBookings,
    loadingMine,
    service,
    hasSelection,
    upcoming,
    loadServices,
    selectService,
    selectSlot,
    submit,
    pendingClaim,
    beginClaim,
    finishClaim,
    watchLast,
    loadMyBookings,
    cancel,
    reset,
  }
})
