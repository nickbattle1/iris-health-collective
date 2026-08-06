import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { fetchPublishedProviders } from '@/services/providerService'
import { distanceKm, MELBOURNE_CBD } from '@/lib/distance'

/* holds the directory: the loaded providers, the active filters, and the
   filtered result. the store never imports firebase directly, it calls the
   service, so this file stays about state rather than about firestore. */

export const useDirectoryStore = defineStore('directory', () => {
  const providers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loaded = ref(false)

  const search = ref('')
  const badges = ref([])   // rainbow-tick, informed-consent, ...
  const access = ref([])   // telehealth, bulkBilling, ...
  const tags = ref([])     // first-nations-affirming, ...

  const origin = ref(MELBOURNE_CBD)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      providers.value = await fetchPublishedProviders()
      loaded.value = true
    } catch (err) {
      error.value = 'We could not load the directory. Please try again.'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // a badge only counts if the claim is currently verified. a self-declared or
  // expired claim shows on the profile but does not satisfy the filter.
  function hasLiveBadge(provider, code) {
    return (provider.accreditations ?? []).some(
      (a) => a.badgeCode === code && a.status === 'verified',
    )
  }

  function matchesSearch(provider) {
    const term = search.value.trim().toLowerCase()
    if (!term) return true
    return [provider.name, provider.practiceName, provider.suburb, provider.postcode]
      .join(' ')
      .toLowerCase()
      .includes(term)
  }

  const results = computed(() => {
    const list = providers.value.filter(
      (p) =>
        matchesSearch(p) &&
        badges.value.every((code) => hasLiveBadge(p, code)) &&
        access.value.every((field) => p[field] === true) &&
        tags.value.every((tag) => (p.approachTags ?? []).includes(tag)),
    )

    return list
      .map((p) => ({
        ...p,
        distance: distanceKm(origin.value.lat, origin.value.lng, p.lat, p.lng),
      }))
      .sort((a, b) => b.ratingAvg - a.ratingAvg || a.distance - b.distance)
  })

  const resultCount = computed(() => results.value.length)

  const filterCount = computed(
    () => badges.value.length + access.value.length + tags.value.length + (search.value ? 1 : 0),
  )

  function toggle(list, value) {
    const i = list.value.indexOf(value)
    if (i === -1) list.value.push(value)
    else list.value.splice(i, 1)
  }

  const toggleBadge = (code) => toggle(badges, code)
  const toggleAccess = (field) => toggle(access, field)
  const toggleTag = (tag) => toggle(tags, tag)

  function clearFilters() {
    search.value = ''
    badges.value = []
    access.value = []
    tags.value = []
  }

  return {
    providers, loading, error, loaded,
    search, badges, access, tags, origin,
    results, resultCount, filterCount,
    load, toggleBadge, toggleAccess, toggleTag, clearFilters,
  }
})
