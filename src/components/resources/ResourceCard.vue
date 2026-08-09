<script setup>
import { useSavedResources } from '@/composables/useSavedResources'
import { RESOURCE_CATEGORIES } from '@/stores/resources'

/* one guide in the list. the whole card opens the guide, via a stretched link
   on the title rather than a second link on the thumbnail, so there is still
   one link with one accessible name.

   the save button writes to localStorage and nothing else, so what somebody
   reads never reaches an account or a server. */

defineProps({
  resource: { type: Object, required: true },
})

const { isSaved, toggle } = useSavedResources()
</script>

<template>
  <article class="resource">
    <img
      v-if="resource.image"
      :src="resource.image"
      alt=""
      class="resource__thumb"
      loading="lazy"
    />
    <span v-else class="resource__thumb resource__thumb--empty" aria-hidden="true">
      <i class="bi bi-file-earmark-text"></i>
    </span>

    <div class="resource__body">
      <h3 class="h6 mb-1 resource__title">
        <RouterLink :to="`/resources/${resource.slug}`" class="stretched-link">
          {{ resource.title }}
        </RouterLink>
      </h3>
      <p class="resource__tag">{{ RESOURCE_CATEGORIES[resource.category] ?? resource.category }}</p>
      <p class="mb-2 small text-muted">{{ resource.summary }}</p>
      <p class="mb-0 small text-muted">{{ resource.readMinutes }} minute read</p>
    </div>

    <button
      type="button"
      class="resource__save"
      :aria-pressed="isSaved(resource.slug)"
      @click="toggle(resource.slug)"
    >
      <i class="bi" :class="isSaved(resource.slug) ? 'bi-bookmark-fill' : 'bi-bookmark'" aria-hidden="true"></i>
      <span class="visually-hidden">
        {{ isSaved(resource.slug) ? 'Remove' : 'Save' }} {{ resource.title }}
      </span>
    </button>
  </article>
</template>

<style scoped>
.resource {
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
}

.resource:hover {
  border-color: var(--iris-purple-500);
  background: var(--iris-purple-50);
}

/* the target is the card now, so the ring goes round the card */
.resource:has(.resource__title a:focus-visible) {
  outline: 3px solid var(--iris-purple-900);
  outline-offset: 2px;
}

/* the body has to claim the leftover width. without this it sizes to its own
   content, and space-between then shares the slack around it, so every card
   starts its text at a different place depending on how long its summary is.
   min-width lets it shrink below its content instead of overflowing. */
.resource__body {
  flex: 1;
  min-width: 0;
}

/* thumbnail, then title, then tag. the tag was the loudest thing on the card
   and the title was a blue underlined link, so the eye landed on the category
   before the article */
.resource__thumb {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  border-radius: var(--iris-radius-sm);
  object-fit: cover;
  background: var(--iris-purple-50);
}

.resource__thumb--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--iris-purple-500);
  font-size: 1.6rem;
}

.resource__title a {
  color: var(--iris-purple-900);
  font-weight: 700;
  text-decoration: none;
}

.resource:hover .resource__title a,
.resource__title a:focus-visible {
  text-decoration: underline;
}

.resource__tag {
  margin-bottom: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--iris-ink-muted);
}

/* above the stretched link, or saving a guide would open it instead */
.resource__save {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  width: var(--iris-target);
  height: var(--iris-target);
  border: 1px solid var(--iris-border);
  border-radius: 50%;
  background: var(--iris-surface);
  color: var(--iris-purple-900);
  font-size: 1.2rem;
  cursor: pointer;
}

.resource__save[aria-pressed='true'] {
  background: var(--iris-purple-900);
  border-color: var(--iris-purple-900);
  color: #fff;
}
</style>
