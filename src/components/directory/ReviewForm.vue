<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZodForm } from '@/composables/useZodForm'
import { REVIEW_COMMENT_MAX, reviewSchema } from '@/lib/schemas'
import { fetchMyReview, submitReview } from '@/services/reviewService'
import BaseField from '@/components/ui/BaseField.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'

/* leaving a review. C.3's user interaction half.

   who cannot review, and why. an anonymous session, because a throwaway
   session per review is free and moderating that is a losing game. a provider,
   because they are the ones being rated. staff, because they approve reviews
   and would be approving their own. all three are checked in submitReview as
   well, since anything in here is only a courtesy.

   the rating is a radio group rather than five clickable stars. stars look
   nicer and are miserable with a keyboard, and this is a form somebody may be
   filling in on a phone about a health service. */

const props = defineProps({
  providerId: { type: String, required: true },
  providerName: { type: String, required: true },
})

const auth = useAuthStore()
const route = useRoute()
const done = ref(false)
const existing = ref(null)
const checking = ref(true)

const isStaffOrProvider = computed(() => auth.role === 'admin' || auth.role === 'provider')

const form = useZodForm(reviewSchema, { rating: 0, comment: '', displayName: '' })
const { values, errors, summary, submitting } = form

async function send() {
  await form.handleSubmit(async (review) => {
    await submitReview({ providerId: props.providerId, review })
    done.value = true
  })
}

// one read to find out whether this person has already had their say here
onMounted(async () => {
  if (auth.isAuthenticated && !isStaffOrProvider.value) {
    try {
      existing.value = await fetchMyReview(props.providerId, auth.user.uid)
    } catch (err) {
      console.error('[reviews] own review', err)
    }
  }
  checking.value = false
})
</script>

<template>
  <div>
    <p v-if="checking" class="text-muted mb-0" aria-busy="true">Checking...</p>

    <div v-else-if="done" class="alert alert-success" role="status">
      <p class="fw-bold mb-1">Thank you, that is with our team</p>
      <p class="mb-0 small">
        A staff member reads every review before it appears, so it will not show
        on the listing straight away.
      </p>
    </div>

    <div v-else-if="!auth.isAuthenticated" class="alert alert-light border">
      <p class="fw-bold mb-1">Reviews need an account</p>
      <p class="small mb-2">
        Browsing and booking work without one. Reviews do not, because a signed
        in account is what stops the same person rating a practice ten times.
      </p>
      <RouterLink
        :to="{ name: 'login', query: { redirect: route.fullPath } }"
        class="btn-iris-outline"
      >
        Sign in to leave a review
      </RouterLink>
    </div>

    <div v-else-if="isStaffOrProvider" class="alert alert-light border mb-0">
      <p class="fw-bold mb-1">Reviews are for community members</p>
      <p class="small mb-0">
        You are signed in as
        {{ auth.role === 'admin' ? 'charity staff' : 'a provider' }}. Staff
        approve reviews and providers are the ones being reviewed, so neither
        can leave one.
      </p>
    </div>

    <div v-else-if="existing" class="alert alert-light border mb-0">
      <p class="fw-bold mb-1">You have already reviewed this practice</p>
      <p class="small mb-0">
        <template v-if="existing.status === 'pending'">
          It is waiting on a staff decision.
        </template>
        <template v-else-if="existing.status === 'approved'">
          It is published on this listing.
        </template>
        <template v-else>It was not published.</template>
        One review per person per practice. Get in touch if you need yours
        changed.
      </p>
    </div>

    <form v-else novalidate @submit.prevent="send">
      <ErrorSummary id="error-summary" :errors="summary" />

      <fieldset class="border-0 p-0 mb-3">
        <legend class="form-label fw-semibold">Your rating of {{ providerName }}</legend>

        <div class="rating-row" :class="{ 'is-invalid-group': errors.rating }">
          <div v-for="n in 5" :key="n" class="rating-option">
            <input
              :id="`rating-${n}`"
              v-model="values.rating"
              class="visually-hidden rating-option__input"
              type="radio"
              name="rating"
              :value="n"
              @change="form.touch('rating')"
            />
            <label class="rating-option__label" :for="`rating-${n}`">
              {{ n }}<span class="visually-hidden"> out of 5</span>
            </label>
          </div>
        </div>

        <p v-if="errors.rating" class="invalid-feedback d-block mb-0">
          <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {{ errors.rating }}
        </p>
      </fieldset>

      <BaseTextarea
        id="comment"
        v-model="values.comment"
        label="What was your experience?"
        hint="Leave it blank if you would rather just give a rating. If you do write something, please leave out anything that identifies a staff member by name."
        :maxlength="REVIEW_COMMENT_MAX"
        :error="errors.comment"
        @blur="form.touch('comment')"
      />

      <BaseField
        id="displayName"
        v-model="values.displayName"
        label="Name to show"
        hint="Leave blank and your review appears as Community member."
        maxlength="40"
        :error="errors.displayName"
        @blur="form.touch('displayName')"
      />

      <button type="submit" class="btn-iris" :disabled="submitting">
        {{ submitting ? 'Sending...' : 'Submit review' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.rating-row {
  display: flex;
  gap: 0.5rem;
}

.rating-option__label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--iris-target);
  height: var(--iris-target);
  border: 2px solid var(--iris-purple-900);
  border-radius: 50%;
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.rating-option__label:hover {
  background: var(--iris-purple-50);
}

.rating-option__input:checked + .rating-option__label {
  background: var(--iris-purple-900);
  color: #fff;
}

.rating-option__input:focus-visible + .rating-option__label {
  outline: 3px solid var(--iris-purple-500);
  outline-offset: 2px;
}

.is-invalid-group .rating-option__label {
  border-color: var(--bs-danger, #b3261e);
}
</style>
