<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchResourceBySlug } from '@/services/resourceService'
import { useSavedResources } from '@/composables/useSavedResources'
import { RESOURCE_CATEGORIES } from '@/stores/resources'

const route = useRoute()
const resource = ref(null)
const loading = ref(true)
const notFound = ref(false)

const { isSaved, toggle } = useSavedResources()

async function load(slug) {
  loading.value = true
  notFound.value = false
  try {
    const found = await fetchResourceBySlug(slug)
    if (found) resource.value = found
    else notFound.value = true
  } catch (err) {
    notFound.value = true
    console.error('[resources] detail', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => load(route.params.slug))
// moving between guides reuses the component, so the param has to be watched
watch(() => route.params.slug, (slug) => slug && load(slug))
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 680px">
    <RouterLink to="/resources" class="d-inline-block mb-3">
      <i class="bi bi-chevron-left" aria-hidden="true"></i> Back to resources
    </RouterLink>

    <p v-if="loading" class="text-muted" aria-busy="true">Loading...</p>

    <template v-else-if="notFound">
      <h1>Guide not found</h1>
      <p class="hero-lead">That guide may have been removed, or the address may have a typo.</p>
      <RouterLink to="/resources" class="btn-iris mt-2">Browse all guides</RouterLink>
    </template>

    <template v-else-if="resource">
      <p class="resource__tag">
        {{ RESOURCE_CATEGORIES[resource.category] ?? resource.category }}
      </p>
      <h1 class="mb-2">{{ resource.title }}</h1>
      <p class="hero-lead mb-2">{{ resource.summary }}</p>
      <p class="text-muted small mb-4">{{ resource.readMinutes }} minute read</p>

      <img v-if="resource.image" :src="resource.image" alt="" class="resource__image mb-4" />

      <section v-for="block in resource.body" :key="block.heading" class="mb-4">
        <h2 class="h5 mb-2">{{ block.heading }}</h2>
        <p class="mb-0">{{ block.text }}</p>
      </section>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <button type="button" class="btn-iris-outline" :aria-pressed="isSaved(resource.slug)" @click="toggle(resource.slug)">
          <i class="bi" :class="isSaved(resource.slug) ? 'bi-bookmark-fill' : 'bi-bookmark'" aria-hidden="true"></i>
          {{ isSaved(resource.slug) ? 'Saved to this device' : 'Save to this device' }}
        </button>
        <RouterLink to="/directory" class="btn-iris">Find affirming care</RouterLink>
      </div>

      <p class="text-muted small border rounded p-3 mt-4">
        General information, not medical advice. If something here does not match
        what your practitioner has told you, go with your practitioner.
      </p>
    </template>
  </div>
</template>

<style scoped>
.resource__tag {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--iris-purple-900);
}

.resource__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--iris-radius-md);
}
</style>
