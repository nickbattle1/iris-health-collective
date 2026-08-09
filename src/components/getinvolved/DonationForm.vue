<script setup>
import { ref } from 'vue'
import { useZodForm } from '@/composables/useZodForm'
import { donationSchema, DONATION_AMOUNTS } from '@/lib/schemas'
import { submitEnquiry } from '@/services/enquiryService'
import BaseField from '@/components/ui/BaseField.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'

/* the card step is disabled and says so. faking a checkout on an assessment
   build would be worse than not having one, and taking real card details would
   be worse again.

   everything above it still works: the amount, the frequency and the contact
   details validate and submit as an enquiry, so somebody can follow up. */

const sent = ref(false)
const custom = ref(false)

const form = useZodForm(donationSchema, {
  amount: 0,
  frequency: 'once',
  name: '',
  email: '',
})
const { values, errors, summary, submitting } = form

function choose(amount) {
  custom.value = false
  values.amount = amount
  form.touch('amount')
}

function chooseOther() {
  custom.value = true
  values.amount = 0
}

async function send() {
  const result = await form.handleSubmit(async (donation) => {
    await submitEnquiry({
      topic: 'donation',
      message:
        `Donation of $${donation.amount} ` +
        `${donation.frequency === 'monthly' ? 'each month' : 'as a one off'}. ` +
        'Card payments are not enabled, so please get in touch about how to give.',
      name: donation.name,
      wantsReply: true,
      email: donation.email,
    })
  })
  if (result.ok) sent.value = true
}
</script>

<template>
  <div>
    <div v-if="sent" class="alert alert-success" role="status">
      <p class="fw-bold mb-1">Thank you, we have your details</p>
      <p class="mb-0 small">
        Someone will be in touch within two business days about how to make the
        gift. Nothing has been charged.
      </p>
    </div>

    <form v-else novalidate @submit.prevent="send">
      <ErrorSummary id="error-summary" :errors="summary" />

      <fieldset class="border-0 p-0 mb-3">
        <legend class="form-label fw-semibold">1. Amount</legend>

        <div class="amount-grid mb-2">
          <button
            v-for="amount in DONATION_AMOUNTS"
            :key="amount"
            type="button"
            class="amount"
            :class="{ 'is-on': !custom && values.amount === amount }"
            :aria-pressed="!custom && values.amount === amount"
            @click="choose(amount)"
          >
            ${{ amount.toLocaleString('en-AU') }}
          </button>

          <button
            type="button"
            class="amount"
            :class="{ 'is-on': custom }"
            :aria-pressed="custom"
            @click="chooseOther"
          >
            Other
          </button>
        </div>

        <BaseField
          v-if="custom"
          id="amount"
          v-model="values.amount"
          label="Amount in dollars"
          type="number"
          inputmode="decimal"
          required
          :error="errors.amount"
          @blur="form.touch('amount')"
        />

        <p v-else-if="errors.amount" class="invalid-feedback d-block mb-0">
          <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {{ errors.amount }}
        </p>
      </fieldset>

      <fieldset class="border-0 p-0 mb-4">
        <legend class="form-label fw-semibold">How often</legend>
        <div class="d-flex gap-2">
          <div v-for="option in [
            { value: 'once', label: 'One time' },
            { value: 'monthly', label: 'Monthly' },
          ]" :key="option.value">
            <input
              :id="`freq-${option.value}`"
              v-model="values.frequency"
              class="visually-hidden freq__input"
              type="radio"
              name="frequency"
              :value="option.value"
            />
            <label class="freq" :for="`freq-${option.value}`">{{ option.label }}</label>
          </div>
        </div>
      </fieldset>

      <h3 class="form-label fw-semibold">2. Your details</h3>

      <BaseField
        id="name"
        v-model="values.name"
        label="Name"
        hint="Whatever you would like on the receipt. A first name is fine."
        maxlength="60"
        :error="errors.name"
        @blur="form.touch('name')"
      />

      <BaseField
        id="email"
        v-model="values.email"
        label="Email address"
        type="email"
        inputmode="email"
        autocomplete="email"
        required
        :error="errors.email"
        @blur="form.touch('email')"
      />

      <p class="text-muted small">
        We do not ask for a postal address. Receipts go by email, and an address
        would be one more thing held about you for no reason.
      </p>

      <h3 class="form-label fw-semibold mt-4">3. Payment</h3>

      <div class="payment" aria-describedby="payment-note">
        <label class="form-label small mb-1" for="card">Credit card</label>
        <input
          id="card"
          class="form-control"
          type="text"
          value=""
          placeholder="Card number                    MM / YY   CVC"
          disabled
        />
      </div>

      <p id="payment-note" class="payment-note">
        <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
        Card payments are not enabled on this build. Enter your details above and
        we will contact you about how to give.
      </p>

      <button type="submit" class="btn-iris" :disabled="submitting">
        {{ submitting ? 'Sending...' : 'Send my details' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
  gap: 0.5rem;
}

.amount {
  min-height: var(--iris-target);
  border: 2px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-surface);
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.amount:hover {
  background: var(--iris-purple-50);
}

.amount.is-on {
  background: var(--iris-purple-900);
  color: #fff;
}

.freq {
  display: inline-flex;
  align-items: center;
  min-height: var(--iris-target);
  padding: 0.5rem 1.4rem;
  border: 2px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-pill);
  color: var(--iris-purple-900);
  font-weight: 700;
  cursor: pointer;
}

.freq__input:checked + .freq {
  background: var(--iris-purple-900);
  color: #fff;
}

.freq__input:focus-visible + .freq {
  outline: 3px solid var(--iris-purple-500);
  outline-offset: 2px;
}

/* greyed out rather than hidden, so it is obvious the step exists and is
   deliberately switched off */
.payment {
  padding: 1rem 1.15rem;
  border: 1px dashed var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
  opacity: 0.6;
}

.payment-note {
  margin: 0.75rem 0 1.25rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  background: var(--iris-purple-50);
  border-left: 4px solid var(--iris-purple-500);
  border-radius: var(--iris-radius-sm);
}
</style>
