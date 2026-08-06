<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { fetchProviderBySlug } from '@/services/providerService'
import { BADGES, INCLUSION_BASIS } from '@/constants/badges'
import { APPROACH_TAGS, ACCESS_FIELDS, DISCIPLINES } from '@/constants/tags'

/* provider profile. the badge section is the point of this page: each claim
   shows who issued it, when it was checked and when it lapses, so a badge is
   a verifiable statement rather than a label someone typed. */

const route = useRoute()
const provider = ref(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    const found = await fetchProviderBySlug(route.params.slug)
    if (found) provider.value = found
    else notFound.value = true
  } catch (err) {
    notFound.value = true
    console.error(err)
  } finally {
    loading.value = false
  }
})

const statusLabel = {
  verified: 'Verified',
  'expiring-soon': 'Expiring soon',
  expired: 'Expired',
  'self-declared': 'Self declared, not verified by us',
}
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 780px">
    <RouterLink to="/directory" class="fw-semibold d-inline-block mb-4">
      <i class="bi bi-chevron-left" aria-hidden="true"></i> Back to directory
    </RouterLink>

    <p v-if="loading" class="text-muted" aria-busy="true">Loading...</p>

    <div v-else-if="notFound">
      <h1>Provider not found</h1>
      <p class="hero-lead">
        That listing may have been removed, or the address may have a typo.
      </p>
      <RouterLink to="/directory" class="btn-iris mt-3">Browse the directory</RouterLink>
    </div>

    <article v-else>
      <h1 class="mb-1">{{ provider.name }}</h1>
      <p class="hero-lead mb-4">
        {{ provider.practiceName }} &middot; {{ provider.suburb }} {{ provider.postcode }}
      </p>

      <p class="mb-4">
        <span
          v-for="d in provider.disciplines"
          :key="d"
          class="badge text-bg-light border me-2"
        >{{ DISCIPLINES[d] ?? d }}</span>
      </p>

      <section class="mb-4" aria-labelledby="why-listed">
        <h2 id="why-listed" class="h5">Why this practice is listed</h2>
        <p class="mb-0">{{ INCLUSION_BASIS[provider.inclusionBasis] }}.</p>
        <p v-if="provider.ratingCount" class="text-muted mb-0">
          Rated {{ provider.ratingAvg }} out of 5 from {{ provider.ratingCount }} community reviews.
        </p>
      </section>

      <section v-if="provider.accreditations?.length" class="mb-4" aria-labelledby="accreditations">
        <h2 id="accreditations" class="h5 mb-3">Accreditation</h2>
        <div
          v-for="claim in provider.accreditations"
          :key="claim.badgeCode"
          class="claim"
          :class="{ 'claim--soft': claim.status !== 'verified' }"
        >
          <p class="mb-1 fw-bold">
            <i
              :class="claim.status === 'verified' ? 'bi bi-patch-check-fill' : 'bi bi-patch-question'"
              aria-hidden="true"
            ></i>
            {{ BADGES[claim.badgeCode]?.label ?? claim.badgeCode }}
            <span class="fw-normal text-muted">({{ statusLabel[claim.status] }})</span>
          </p>
          <p class="mb-1 small">{{ BADGES[claim.badgeCode]?.short }}</p>
          <p class="mb-0 small text-muted">
            Issued by {{ BADGES[claim.badgeCode]?.issuer }}<template v-if="claim.verifiedAt">,
            checked {{ claim.verifiedAt }}</template><template v-if="claim.expiresAt">,
            due for review {{ claim.expiresAt }}</template>
          </p>
        </div>
      </section>

      <section class="mb-4" aria-labelledby="access">
        <h2 id="access" class="h5 mb-2">Access</h2>
        <ul class="list-unstyled mb-0">
          <li v-for="(label, field) in ACCESS_FIELDS" :key="field" class="mb-1">
            <i
              :class="provider[field] ? 'bi bi-check-circle-fill text-success' : 'bi bi-dash-circle text-muted'"
              aria-hidden="true"
            ></i>
            {{ label }}
            <span class="visually-hidden">{{ provider[field] ? 'available' : 'not available' }}</span>
          </li>
        </ul>
        <p v-if="provider.languages?.length" class="mt-2 mb-0">
          Languages besides English: {{ provider.languages.join(', ') }}
        </p>
      </section>

      <section v-if="provider.approachTags?.length" class="mb-4" aria-labelledby="approach">
        <h2 id="approach" class="h5 mb-2">Approach</h2>
        <p class="mb-0">
          <span v-for="t in provider.approachTags" :key="t" class="badge text-bg-light border me-2">
            {{ APPROACH_TAGS[t] ?? t }}
          </span>
        </p>
      </section>

      <section class="mb-4" aria-labelledby="contact">
        <h2 id="contact" class="h5 mb-2">Contact</h2>
        <p class="mb-1">
          <a :href="`tel:${provider.contactPhone.replace(/\s/g, '')}`">{{ provider.contactPhone }}</a>
        </p>
        <p class="mb-0 text-muted">{{ provider.hours }}</p>
      </section>

      <RouterLink to="/book" class="btn-iris">Book a session</RouterLink>
    </article>
  </div>
</template>

<style scoped>
.claim {
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-purple-500);
  border-left-width: 5px;
  border-radius: var(--iris-radius-sm);
  background: var(--iris-purple-50);
}

.claim--soft {
  border-color: var(--iris-border);
  background: var(--iris-surface-muted);
}
</style>
