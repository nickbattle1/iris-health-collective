import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { fetchPublishedProviders } from '@/services/providerService'
import { distanceKm, MELBOURNE_CBD } from '@/lib/distance'
import { APPROACH_TAGS, DISCIPLINES } from '@/constants/tags'

/* holds the directory: the loaded providers, the active filters, and the
   filtered result. the store never imports firebase directly, it calls the
   service, so this file stays about state rather than about firestore. */

export const useDirectoryStore = defineStore('directory', () => {
  const providers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loaded = ref(false)

  const search = ref('')
  const disciplines = ref([])
  const languages = ref([])
  const badges = ref([])   // rainbow-tick, informed-consent, ...
  const access = ref([])   // telehealth, bulkBilling, ...
  const tags = ref([])     // first-nations-affirming, ...

  const origin = ref(MELBOURNE_CBD)
  const originLabel = ref('Melbourne, Victoria')
  const usingPrecise = ref(false)
  const locating = ref(false)
  const locationError = ref('')

  /* how far out to look. anywhere by default on purpose: Darius is in
     Shepparton and a 10km default would show him nothing at all. sharing a
     location switches it to 25km, because that is the point at which a radius
     starts being useful rather than a trap */
  const radiusKm = ref(0) // 0 means no limit

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

  /* hyphens out, so "sexual health" finds sexual-health and "first nations"
     finds first-nations-affirming. someone typing into a search box is not
     going to guess our slugs */
  const normalise = (value) => String(value ?? '').toLowerCase().replace(/-/g, ' ')

  /* both the code and its label go in, because the data says counselling and
     the screen says Counselling, and either one should find the provider.
     leaving disciplines out of here was why searching the word printed in the
     placeholder returned nothing. */
  function searchable(provider) {
    return [
      provider.name,
      provider.practiceName,
      provider.suburb,
      provider.postcode,
      ...(provider.disciplines ?? []).flatMap((code) => [code, DISCIPLINES[code]]),
      ...(provider.approachTags ?? []).flatMap((code) => [code, APPROACH_TAGS[code]]),
      ...(provider.languages ?? []),
    ]
      .filter(Boolean)
      .map(normalise)
      .join(' ')
  }

  function matchesSearch(provider) {
    const term = normalise(search.value.trim())
    if (!term) return true
    return searchable(provider).includes(term)
  }

  /* built from what the directory actually holds rather than a constant, so a
     language nobody speaks never gets a chip. auslan is left out because it is
     already an access filter and the same thing in two groups is confusing. */
  const languageOptions = computed(() => {
    const found = new Set()
    for (const p of providers.value) {
      for (const lang of p.languages ?? []) if (lang !== 'Auslan') found.add(lang)
    }
    return Object.fromEntries([...found].sort().map((lang) => [lang, lang]))
  })

  const results = computed(() => {
    const list = providers.value.filter(
      (p) =>
        matchesSearch(p) &&
        badges.value.every((code) => hasLiveBadge(p, code)) &&
        access.value.every((field) => p[field] === true) &&
        tags.value.every((tag) => (p.approachTags ?? []).includes(tag)) &&
        // any of the chosen services, not all. nobody wants a GP who is also
        // an endocrinologist and a peer worker
        (!disciplines.value.length ||
          disciplines.value.some((code) => (p.disciplines ?? []).includes(code))) &&
        (!languages.value.length ||
          languages.value.some((lang) => (p.languages ?? []).includes(lang))),
    )

    return list
      .map((p) => ({
        ...p,
        distance: distanceKm(origin.value.lat, origin.value.lng, p.lat, p.lng),
      }))
      .filter((p) => !radiusKm.value || p.distance <= radiusKm.value)
      .sort((a, b) => b.ratingAvg - a.ratingAvg || a.distance - b.distance)
  })

  const resultCount = computed(() => results.value.length)

  const filterCount = computed(
    () =>
      badges.value.length +
      access.value.length +
      tags.value.length +
      disciplines.value.length +
      languages.value.length +
      (radiusKm.value ? 1 : 0) +
      (search.value ? 1 : 0),
  )

  function toggle(list, value) {
    const i = list.value.indexOf(value)
    if (i === -1) list.value.push(value)
    else list.value.splice(i, 1)
  }

  const toggleBadge = (code) => toggle(badges, code)
  const toggleAccess = (field) => toggle(access, field)
  const toggleTag = (tag) => toggle(tags, tag)
  const toggleDiscipline = (code) => toggle(disciplines, code)
  const toggleLanguage = (lang) => toggle(languages, lang)

  /* the browser asks for permission, we never do. the coordinates sit in this
     store for the visit and are not written anywhere, which matters on a site
     where the whole premise is not leaving a trail behind you. */
  function useMyLocation() {
    if (!navigator.geolocation) {
      locationError.value = 'This browser cannot share a location.'
      return
    }

    locating.value = true
    locationError.value = ''

    navigator.geolocation.getCurrentPosition(
      (position) => {
        origin.value = { lat: position.coords.latitude, lng: position.coords.longitude }
        originLabel.value = 'Your current location'
        usingPrecise.value = true
        // a radius only makes sense once we know where somebody actually is
        if (!radiusKm.value) radiusKm.value = 25
        locating.value = false
      },
      (err) => {
        locating.value = false
        locationError.value =
          err.code === err.PERMISSION_DENIED
            ? 'Location sharing is off. Distances stay measured from the Melbourne CBD.'
            : 'We could not work out where you are. Distances stay measured from the CBD.'
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  function resetLocation() {
    origin.value = MELBOURNE_CBD
    originLabel.value = 'Melbourne, Victoria'
    usingPrecise.value = false
    radiusKm.value = 0
    locationError.value = ''
  }

  function clearFilters() {
    search.value = ''
    disciplines.value = []
    languages.value = []
    badges.value = []
    access.value = []
    tags.value = []
  }

  return {
    providers, loading, error, loaded,
    search, badges, access, tags, disciplines, languages, languageOptions,
    origin, originLabel, usingPrecise, locating, locationError, radiusKm,
    results, resultCount, filterCount,
    load, toggleBadge, toggleAccess, toggleTag, toggleDiscipline, toggleLanguage,
    useMyLocation, resetLocation, clearFilters,
  }
})

