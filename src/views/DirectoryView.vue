<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDirectoryStore } from '@/stores/directory'
import { APPROACH_TAGS, ACCESS_FIELDS } from '@/constants/tags'
import { BADGES } from '@/constants/badges'
import FilterChips from '@/components/directory/FilterChips.vue'
import ProviderCard from '@/components/directory/ProviderCard.vue'

/* find affirming care, figure 3 of the design report. serves US-3: filter by
   accreditation before contacting anyone.

   the result count sits in an aria-live region so toggling a chip announces
   how many providers are left, rather than silently changing the list. */

const store = useDirectoryStore()
const { search, badges, access, tags, results, resultCount, filterCount, loading, error } =
  storeToRefs(store)

// badge filters only offer the externally issued ones, since those are the
// claims a user can actually rely on
const trustOptions = Object.fromEntries(
  Object.entries(BADGES)
    .filter(([, b]) => b.externallyIssued)
    .map(([code, b]) => [code, b.label]),
)

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-4">Find affirming care</h1>

    <div class="mb-4" style="max-width: 42rem">
      <label for="provider-search" class="form-label fw-semibold">
        Search by need, practice or suburb
      </label>
      <input
        id="provider-search"
        v-model="search"
        type="search"
        class="form-control form-control-lg"
        placeholder="Try Brunswick, or counselling"
        autocomplete="off"
      />
    </div>

    <FilterChips
      legend="Trust and approach"
      :options="trustOptions"
      :active="badges"
      @toggle="store.toggleBadge"
    />

    <FilterChips
      legend="Access"
      :options="ACCESS_FIELDS"
      :active="access"
      variant="outline"
      @toggle="store.toggleAccess"
    />

    <FilterChips
      legend="Identity and approach"
      :options="APPROACH_TAGS"
      :active="tags"
      variant="outline"
      @toggle="store.toggleTag"
    />

    <div class="d-flex align-items-center justify-content-between border-top pt-3 mb-3">
      <p class="mb-0 fw-semibold" role="status" aria-live="polite">
        <span v-if="loading">Loading providers</span>
        <span v-else>Showing {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}</span>
      </p>
      <button
        v-if="filterCount"
        type="button"
        class="btn btn-link fw-semibold p-0"
        @click="store.clearFilters"
      >
        Clear filters
      </button>
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

    <ProviderCard
      v-for="provider in results"
      v-else
      :key="provider.id"
      :provider="provider"
    />

    <p class="text-muted small border rounded p-3 mt-4">
      Listings meet the charity's inclusion criteria and are reviewed each year.
      Distances are measured from the Melbourne CBD.
    </p>
  </div>
</template>
