<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDirectoryStore, SORT_OPTIONS } from '@/stores/directory'
import { APPROACH_TAGS, ACCESS_FIELDS, DISCIPLINES } from '@/constants/tags'
import { BADGES } from '@/constants/badges'
import FilterChips from '@/components/directory/FilterChips.vue'
import LocationBar from '@/components/directory/LocationBar.vue'
import ProviderMap from '@/components/directory/ProviderMap.vue'
import ProviderCard from '@/components/directory/ProviderCard.vue'

/* find affirming care, figure 3 of the design report. serves US-3: filter by
   accreditation before contacting anyone.

   the chips used to sit open on the page, which pushed every provider below
   the fold on a phone. they live behind a button now, closed by default, and
   the button carries a count so it is obvious when something is filtering the
   list you are looking at.

   the result count sits in an aria-live region so toggling a chip announces
   how many providers are left, rather than silently changing the list. */

const store = useDirectoryStore()
const {
  search, badges, access, tags, disciplines, languages, languageOptions,
  results, resultCount, filterCount, loading, error, sort,
} = storeToRefs(store)

const filtersOpen = ref(false)

/* list or map, one at a time. side by side looks tidy on a desktop and is
   unusable on a phone, and this is a mobile first design, so the same control
   drives both sizes */
const view = ref('list')
const router = useRouter()

const {
  originLabel, usingPrecise, locating, locationError, origin, radiusKm,
} = storeToRefs(store)

/* trust means somebody else checked, so only the two claims from the wireframe
   go here. HIV experienced is a clinical focus rather than an inclusion
   standard, so it sits with identity below. */
const trustOptions = {
  'rainbow-tick': BADGES['rainbow-tick'].label,
  'informed-consent': BADGES['informed-consent'].label,
}

/* this group mixes two kinds of filter. HIV experienced is an accreditation on
   the provider, the rest are approach tags, so the key carries which one it is
   and toggleIdentity splits it back apart. one visual group, two stores. */
const identityOptions = {
  'badge:hiv-experienced': BADGES['hiv-experienced'].label,
  ...Object.fromEntries(Object.entries(APPROACH_TAGS).map(([code, label]) => [`tag:${code}`, label])),
}

const identityActive = computed(() => [
  ...badges.value.filter((code) => !(code in trustOptions)).map((code) => `badge:${code}`),
  ...tags.value.map((code) => `tag:${code}`),
])

function toggleIdentity(key) {
  const [kind, code] = key.split(':')
  if (kind === 'badge') store.toggleBadge(code)
  else store.toggleTag(code)
}

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Find affirming care</h1>
    <p class="hero-lead mb-3">
      Independent GPs and allied health providers across Victoria, checked by us
      so you do not have to work out who gets it.
    </p>

    <p class="scope-note mb-4">
      These practices are not part of Iris Health Collective. Contact them
      directly to make an appointment. To book counselling, peer navigation or a
      group session with us, use <RouterLink to="/book">Book a session</RouterLink>.
    </p>

    <div class="search-row">
      <label for="provider-search" class="visually-hidden">
        Search by need, practice or suburb
      </label>
      <input
        id="provider-search"
        v-model="search"
        type="search"
        class="form-control form-control-lg"
        placeholder="Search by need, practice or suburb"
        autocomplete="off"
      />

      <button
        type="button"
        class="filter-btn"
        :class="{ 'is-on': filterCount > 0 }"
        :aria-expanded="filtersOpen"
        aria-controls="filter-panel"
        @click="filtersOpen = !filtersOpen"
      >
        <i class="bi bi-sliders" aria-hidden="true"></i>
        <span class="visually-hidden">
          Filters<template v-if="filterCount">, {{ filterCount }} applied</template>
        </span>
        <span v-if="filterCount" class="filter-btn__count" aria-hidden="true">{{ filterCount }}</span>
      </button>
    </div>

    <LocationBar
      :label="originLabel"
      :locating="locating"
      :using-precise="usingPrecise"
      :error="locationError"
      :radius-km="radiusKm"
      @update:radius-km="(km) => (radiusKm = km)"
      @locate="store.useMyLocation"
      @reset="store.resetLocation"
    />

    <div v-show="filtersOpen" id="filter-panel" class="filter-panel">
      <FilterChips
        legend="Trust and approach"
        :options="trustOptions"
        :active="badges"
        @toggle="store.toggleBadge"
      />

      <FilterChips
        legend="Service"
        :options="DISCIPLINES"
        :active="disciplines"
        variant="outline"
        @toggle="store.toggleDiscipline"
      />

      <FilterChips
        legend="Identity and approach"
        :options="identityOptions"
        :active="identityActive"
        variant="outline"
        @toggle="toggleIdentity"
      />

      <FilterChips
        v-if="Object.keys(languageOptions).length"
        legend="Languages spoken"
        :options="languageOptions"
        :active="languages"
        variant="outline"
        @toggle="store.toggleLanguage"
      />

      <FilterChips
        legend="Access"
        :options="ACCESS_FIELDS"
        :active="access"
        variant="outline"
        @toggle="store.toggleAccess"
      />
    </div>

    <div class="results-bar border-top pt-3 mb-3">
      <p class="mb-0 fw-semibold" role="status" aria-live="polite">
        <span v-if="loading">Loading providers</span>
        <span v-else>Showing {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}</span>
      </p>
      <div class="d-flex align-items-center flex-wrap gap-3">
        <div class="sort-row">
          <label class="fw-semibold small mb-0" for="sort-by">Sort by</label>
          <select id="sort-by" v-model="sort" class="form-select form-select-sm sort-select">
            <option v-for="(label, value) in SORT_OPTIONS" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="view-toggle" role="group" aria-label="Show results as">
          <button
            type="button"
            class="view-toggle__btn"
            :class="{ 'is-on': view === 'list' }"
            :aria-pressed="view === 'list'"
            @click="view = 'list'"
          >
            <i class="bi bi-list-ul" aria-hidden="true"></i> List
          </button>
          <button
            type="button"
            class="view-toggle__btn"
            :class="{ 'is-on': view === 'map' }"
            :aria-pressed="view === 'map'"
            @click="view = 'map'"
          >
            <i class="bi bi-geo-alt" aria-hidden="true"></i> Map
          </button>
        </div>

        <button
          v-if="filterCount"
          type="button"
          class="btn btn-link fw-semibold p-0"
          @click="store.clearFilters"
        >
          Clear filters
        </button>
      </div>
    </div>

    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>

    <div v-else-if="loading" class="text-muted py-4" aria-busy="true">
      <i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading the directory...
    </div>

    <div v-else-if="!resultCount" class="text-center py-5">
      <p class="hero-lead mx-auto">
        No providers match those filters. Try removing one, or search a nearby suburb.
      </p>
      <button type="button" class="btn-iris-outline mt-2" @click="store.clearFilters">
        Clear filters
      </button>
    </div>

    <ProviderMap
      v-else-if="view === 'map'"
      :providers="results"
      :origin="origin"
      :origin-label="originLabel"
      :radius-km="radiusKm"
      @select="(slug) => router.push(`/directory/${slug}`)"
    />

    <ProviderCard v-for="provider in results" v-else :key="provider.id" :provider="provider" />

    <p class="text-muted small border rounded p-3 mt-4">
      Listings meet the charity's inclusion criteria and are reviewed each year.
      Distances are measured from the Naarm (Melbourne) CBD, on Wurundjeri
      Woi-wurrung country, unless you share a precise location.
    </p>
  </div>
</template>

<style scoped>
/* same treatment as the note on the booking page. the two halves of the site
   do different things and the difference is not obvious from the nav */
.scope-note {
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
  background: var(--iris-surface-muted);
  border-left: 4px solid var(--iris-purple-500);
  border-radius: var(--iris-radius-sm);
}

/* the count, the sort and the view toggle share a row on a desktop and stack
   on a phone rather than squeezing a select down to nothing */
.results-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.sort-select {
  width: auto;
  min-height: 40px;
  font-weight: 700;
  color: var(--iris-purple-900);
}

.view-toggle {
  display: inline-flex;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-pill);
  overflow: hidden;
}

.view-toggle__btn {
  border: 0;
  background: var(--iris-surface);
  padding: 0.4rem 0.9rem;
  min-height: 40px;
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.view-toggle__btn.is-on {
  background: var(--iris-purple-900);
  color: #fff;
}

.search-row {
  display: flex;
  gap: 0.6rem;
  align-items: stretch;
  max-width: 42rem;
  margin-bottom: 1rem;
}

.search-row .form-control {
  flex: 1;
  min-width: 0;
}

/* same surface as the input beside it, so the pair reads as one control.
   inverts once something is filtering, because a hidden panel with three chips
   on inside it is otherwise invisible */
.filter-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 3.2rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-surface);
  color: var(--iris-purple-900);
  font-size: 1.35rem;
  cursor: pointer;
}

.filter-btn:hover {
  background: var(--iris-purple-50);
}

.filter-btn.is-on {
  background: var(--iris-purple-900);
  border-color: var(--iris-purple-900);
  color: #fff;
}

.filter-btn__count {
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.3rem;
  border-radius: var(--iris-radius-pill);
  background: var(--iris-purple-900);
  border: 2px solid var(--iris-surface);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.1rem;
}

.filter-panel {
  padding: 1.15rem 1.15rem 0.25rem;
  margin-bottom: 1.25rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}
</style>

