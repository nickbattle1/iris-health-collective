<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'
import { useZodForm } from '@/composables/useZodForm'
import { bookingDetailsSchema } from '@/lib/schemas'
import BaseField from '@/components/ui/BaseField.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'
import BookingSummary from '@/components/booking/BookingSummary.vue'

// step 2, and the screen B.1 gets marked on.
//
// the form only asks what the appointment actually uses. no gender field, the
// booking never reads one and asking adds disclosure risk for nothing. no
// legal name either, a chosen name is what the practitioner needs to greet
// someone properly

const store = useBookingStore()
const auth = useAuthStore()
const router = useRouter()
const { service, startAt } = storeToRefs(store)

const whyPronouns = ref(false)

const form = useZodForm(bookingDetailsSchema, {
  chosenName: '',
  pronouns: '',
  notes: '',
  wantsEmail: false,
  email: '',
  wantsSms: false,
  mobile: '',
  discreetReminder: true,
})

const { values, errors, summary, submitting } = form

// signed in means they've already told us, so prefill. stays editable though,
// the name on an account isn't always the name you want used on the day
onMounted(() => {
  values.chosenName = auth.profile?.displayName ?? auth.user?.displayName ?? ''
  values.pronouns = auth.profile?.pronouns ?? ''
  if (auth.user?.email) values.email = auth.user.email
})

// turning a contact option off shouldn't leave a stale error sitting under a
// field that isn't required any more
watch(
  () => values.wantsEmail,
  () => form.clearServerError('email'),
)
watch(
  () => values.wantsSms,
  () => form.clearServerError('mobile'),
)

async function submit() {
  await form.handleSubmit(async (details) => {
    await store.submit(details)
    router.push({ name: 'book-confirm' })
  })
}
</script>

<template>
  <div>
    <BookingSummary v-if="service && startAt" :service="service" :start-at="startAt" />

    <ErrorSummary id="error-summary" :errors="summary" />

    <form novalidate @submit.prevent="submit">
      <BaseField
        id="chosenName"
        v-model="values.chosenName"
        label="Chosen name"
        hint="What should we call you? This is the only name we use, in reminders and at reception."
        autocomplete="nickname"
        maxlength="60"
        required
        :error="errors.chosenName"
        @blur="form.touch('chosenName')"
      />

      <BaseField
        id="pronouns"
        v-model="values.pronouns"
        label="Pronouns"
        placeholder="Self-describe, or leave blank"
        maxlength="40"
        :error="errors.pronouns"
        @blur="form.touch('pronouns')"
      >
        <template #labelAction>
          <button
            type="button"
            class="why-ask"
            :aria-expanded="whyPronouns"
            aria-controls="why-pronouns"
            @click="whyPronouns = !whyPronouns"
          >
            Why we ask this
          </button>
        </template>
        <template #beforeInput>
          <p v-if="whyPronouns" id="why-pronouns" class="why-ask__body">
            Your practitioner sees this before the session, so they address you
            correctly the first time and you do not have to correct anyone. Leave
            it blank and we will simply use your chosen name.
          </p>
        </template>
      </BaseField>

      <hr class="my-4" />

      <h2 class="h5 mb-3">How we confirm and remind you</h2>

      <BaseCheckbox
        id="wantsEmail"
        v-model="values.wantsEmail"
        label="Email me a PDF confirmation"
        description="A one page confirmation with the time, the practitioner and how to get there."
      />

      <BaseField
        v-if="values.wantsEmail"
        id="email"
        v-model="values.email"
        label="Email address"
        type="email"
        autocomplete="email"
        inputmode="email"
        required
        :error="errors.email"
        @blur="form.touch('email')"
      />

      <BaseCheckbox
        id="wantsSms"
        v-model="values.wantsSms"
        label="Text me a reminder the day before"
        description="Australian mobile numbers only."
      />

      <BaseField
        v-if="values.wantsSms"
        id="mobile"
        v-model="values.mobile"
        label="Mobile number"
        type="tel"
        autocomplete="tel-national"
        inputmode="numeric"
        placeholder="0400 000 000"
        required
        :error="errors.mobile"
        @blur="form.touch('mobile')"
      />

      <BaseCheckbox
        id="discreetReminder"
        v-model="values.discreetReminder"
        label="Keep reminders discreet"
        description="The reminder shows the date and time only. No service name and no organisation name appears on your lock screen or in a shared calendar."
      />

      <hr class="my-4" />

      <BaseTextarea
        id="notes"
        v-model="values.notes"
        label="Anything the practitioner should know"
        hint="Access needs, an interpreter, or anything you would rather not say out loud on the day."
        :maxlength="300"
        :error="errors.notes"
        @blur="form.touch('notes')"
      />

      <div class="not-asked mb-4">
        <p class="fw-bold mb-2">What we deliberately do not ask</p>
        <ul class="mb-0 small">
          <li>No gender field. The booking never uses one, and asking raises disclosure risk.</li>
          <li>No legal name. Your chosen name is what the practitioner sees.</li>
          <li>
            Contact details are only stored if you asked for a confirmation or a reminder above.
          </li>
        </ul>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button type="submit" class="btn-iris flex-grow-1" :disabled="submitting">
          {{ submitting ? 'Confirming...' : 'Confirm this booking' }}
        </button>
        <RouterLink to="/book" class="btn-iris-outline">Back</RouterLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* a button not a details element, because it has to sit on the label row and
   summary brings its own layout with it */
.why-ask {
  border: 0;
  background: none;
  padding: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--iris-purple-900);
  text-decoration: underline;
  cursor: pointer;
}

.why-ask__body {
  padding: 0.7rem 0.9rem;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  background: var(--iris-purple-50);
  border-radius: var(--iris-radius-sm);
}

.not-asked {
  padding: 1rem 1.15rem;
  border: 1px dashed var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}
</style>
