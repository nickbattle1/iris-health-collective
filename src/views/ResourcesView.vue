<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourceStore } from '@/stores/resources'
import { useSavedResources } from '@/composables/useSavedResources'
import ResourceCard from '@/components/resources/ResourceCard.vue'

/* the resources section the A1 feedback flagged as missing from the prototype.

   no account, no session, no analytics. what somebody reads here is the most
   sensitive thing on the site and the safest place for it is nowhere. saving a
   guide writes a slug to localStorage on the device and that is all. */

const store = useResourceStore()
const { results, categories, category, savedOnly, loading, error } = storeToRefs(store)
const { saved } = useSavedResources()

onMounted(() => store.load())
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 780px">
    <h1 class="mb-2">Resources and education</h1>
    <p class="hero-lead mb-3">
      Plain language guides written with the community, free to read with no
      account.
    </p>

    <p class="scope-note mb-4">
      Nothing you read here is recorded. Saving a guide keeps it on this device
      only, so it does not follow you to another one and it does not reach us.
    </p>

    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>

    <fieldset class="border-0 p-0 mb-4">
      <legend class="visually-hidden">Filter guides</legend>

      <div class="d-flex flex-wrap gap-2">
        <button
          type="button"
          class="chip"
          :class="{ 'is-on': !category && !savedOnly }"
          @click="category = ''; savedOnly = false"
        >
          All guides
        </button>

        <button
          v-for="[key, label] in categories"
          :key="key"
          type="button"
          class="chip"
          :class="{ 'is-on': category === key }"
          :aria-pressed="category === key"
          @click="category = category === key ? '' : key"
        >
          {{ label }}
        </button>

        <button
          type="button"
          class="chip"
          :class="{ 'is-on': savedOnly }"
          :aria-pressed="savedOnly"
          @click="savedOnly = !savedOnly"
        >
          <i class="bi bi-bookmark-fill" aria-hidden="true"></i>
          Saved<template v-if="saved.length"> ({{ saved.length }})</template>
        </button>
      </div>
    </fieldset>

    <p class="fw-semibold" role="status" aria-live="polite">
      <span v-if="loading">Loading guides</span>
      <span v-else>{{ results.length }} {{ results.length === 1 ? 'guide' : 'guides' }}</span>
    </p>

    <ResourceCard v-for="resource in results" :key="resource.slug" :resource="resource" />

    <p v-if="!loading && !results.length" class="text-muted">
      <template v-if="savedOnly">
        You have not saved anything yet. Tap the bookmark on a guide to keep it here.
      </template>
      <template v-else>No guides in that category yet.</template>
    </p>
  </div>
</template>

<style scoped>
.scope-note {
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
  background: var(--iris-surface-muted);
  border-left: 4px solid var(--iris-purple-500);
  border-radius: var(--iris-radius-sm);
}

.chip {
  min-height: var(--iris-target);
  padding: 0.5rem 1.15rem;
  border: 2px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-pill);
  background: var(--iris-surface);
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.chip:hover {
  background: var(--iris-purple-50);
}

.chip.is-on {
  background: var(--iris-purple-900);
  color: #fff;
}
</style>
