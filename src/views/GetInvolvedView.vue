<script setup>
import { computed, onMounted, nextTick, ref } from 'vue'
import { useZodForm } from '@/composables/useZodForm'
import { enquirySchema, ENQUIRY_MESSAGE_MAX } from '@/lib/schemas'
import { submitEnquiry } from '@/services/enquiryService'
import BaseField from '@/components/ui/BaseField.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'
import EventList from '@/components/getinvolved/EventList.vue'
import DonationForm from '@/components/getinvolved/DonationForm.vue'
import { fetchUpcomingEvents } from '@/services/eventService'

/* volunteering, donating and applying to be listed.

   all three go through submitEnquiry with a different topic rather than three
   more cloud functions. the shape is identical, the rules are identical, and a
   third callable would be a fourth thing to deploy and moderate for no gain.

   there is no payment form. taking card details on an assignment build would be
   wrong, so the donate panel explains the options and says plainly that nothing
   is processed here. */

const panels = [
  {
    id: 'volunteer',
    topic: 'volunteer',
    title: 'Volunteer with us',
    icon: 'bi-people-fill',
    intro:
      'Around forty volunteers keep this running. Peer support, events, admin, and helping people navigate their first appointment.',
    points: [
      'A few hours a month is enough, and school hours work',
      'Full training, and you are never on your own for a first shift',
      'Lived experience is valued, and it is not a requirement',
    ],
    prompt: 'Tell us a little about yourself and what you would like to help with.',
    cta: 'Register interest',
  },
  {
    id: 'listing',
    topic: 'listing',
    title: 'List your practice',
    icon: 'bi-clipboard-check-fill',
    intro:
      'Practices apply to be listed in the directory. Listing is free, and it cannot be bought.',
    points: [
      'Assessed against accreditation, approach, access and community feedback',
      'Every listing states why it was included',
      'Reviewed each year, and removed if community feedback says the practice has changed',
    ],
    prompt:
      'Tell us the practice name, suburb, and what makes it a safe place for LGBTIQ+ patients.',
    cta: 'Apply to be listed',
  },
]

const tabs = [
  { id: 'volunteer', title: 'Volunteer with us' },
  { id: 'events', title: 'Events and workshops' },
  { id: 'listing', title: 'List your practice' },
  { id: 'donate', title: 'Donate' },
]

const openPanel = ref('volunteer')
const sent = ref('')

const events = ref([])
const loadingEvents = ref(false)
// the event you pressed register on, so the form can say what it is for
const registeringFor = ref(null)

const activePanel = computed(() => panels.find((panel) => panel.id === openPanel.value))

const form = useZodForm(enquirySchema, {
  topic: 'volunteer',
  message: '',
  name: '',
  wantsReply: false,
  email: '',
})
const { values, errors, summary, submitting } = form

function choose(id) {
  openPanel.value = id
  sent.value = ''
  registeringFor.value = null
  form.reset()
  const panel = panels.find((item) => item.id === id)
  if (panel) values.topic = panel.topic
}

/* registering reuses the same enquiry form rather than adding another one.
   the message is prefilled with the event so the charity knows which session,
   and it stays editable in case somebody needs to add an access requirement. */
async function register(event) {
  registeringFor.value = event
  openPanel.value = 'register'
  sent.value = ''
  form.reset()
  values.topic = 'events'
  values.message = `I would like to register for ${event.name} on ${new Date(
    event.startAt,
  ).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}.`
  await nextTick()
  document.getElementById('message')?.focus()
}

onMounted(async () => {
  loadingEvents.value = true
  try {
    events.value = await fetchUpcomingEvents()
  } catch (err) {
    console.error('[events] load', err)
  } finally {
    loadingEvents.value = false
  }
})

async function send() {
  const label = registeringFor.value ? registeringFor.value.name : activePanel.value.title
  const result = await form.handleSubmit(async (enquiry) => {
    await submitEnquiry(enquiry)
  })
  if (result.ok) {
    sent.value = label
    form.reset()
    values.topic = registeringFor.value ? 'events' : activePanel.value.topic
  }
}
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 780px">
    <h1 class="mb-2">Get involved</h1>
    <p class="hero-lead mb-4">
      Volunteering, donations, and applying to have your practice listed.
    </p>

    <div class="d-flex flex-wrap gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="chip"
        :class="{ 'is-on': openPanel === tab.id || (tab.id === 'events' && openPanel === 'register') }"
        :aria-pressed="openPanel === tab.id"
        @click="choose(tab.id)"
      >
        {{ tab.title }}
      </button>
    </div>

    <section v-if="openPanel === 'events'" class="panel mb-5" aria-labelledby="events-heading">
      <h2 id="events-heading" class="h5 mb-2">
        <i class="bi bi-calendar-event-fill" aria-hidden="true"></i> Events and workshops
      </h2>
      <p class="mb-4">
        Peer groups, workshops and community sessions. Everything is free, and
        registering means we know how many chairs to put out.
      </p>

      <EventList :events="events" :loading="loadingEvents" @register="register" />
    </section>

    <section v-else-if="openPanel === 'register'" class="panel mb-5" aria-labelledby="register-heading">
      <h2 id="register-heading" class="h5 mb-2">
        <i class="bi bi-calendar-check-fill" aria-hidden="true"></i>
        Register for {{ registeringFor?.name }}
      </h2>
      <p class="mb-4">
        Tell us anything we should know, like an access requirement or whether
        you are bringing someone. Everything below is optional except the message.
      </p>

      <div v-if="sent === registeringFor?.name" class="alert alert-success" role="status">
        <p class="fw-bold mb-1">You are registered</p>
        <p class="mb-0 small">
          Nothing further is needed. If you asked for a reply we will confirm by
          email, otherwise just turn up.
        </p>
      </div>

      <form v-else novalidate @submit.prevent="send">
        <ErrorSummary id="error-summary" :errors="summary" />

        <BaseTextarea
          id="message"
          v-model="values.message"
          label="Your message"
          :maxlength="ENQUIRY_MESSAGE_MAX"
          :rows="4"
          required
          :error="errors.message"
          @blur="form.touch('message')"
        />

        <BaseField
          id="name"
          v-model="values.name"
          label="Name"
          hint="Whatever you would like us to call you on the day."
          maxlength="60"
          :error="errors.name"
          @blur="form.touch('name')"
        />

        <BaseCheckbox
          id="wantsReply"
          v-model="values.wantsReply"
          label="I would like a confirmation email"
          description="Leave this off and we keep no way to contact you."
        />

        <BaseField
          v-if="values.wantsReply"
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

        <div class="d-flex flex-wrap gap-2">
          <button type="submit" class="btn-iris" :disabled="submitting">
            {{ submitting ? 'Sending...' : 'Register' }}
          </button>
          <button type="button" class="btn-iris-outline" @click="choose('events')">
            Back to events
          </button>
        </div>
      </form>
    </section>

    <section v-else-if="activePanel" class="panel mb-5" :aria-labelledby="`${activePanel.id}-heading`">
      <h2 :id="`${activePanel.id}-heading`" class="h5 mb-2">
        <i class="bi" :class="activePanel.icon" aria-hidden="true"></i>
        {{ activePanel.title }}
      </h2>
      <p>{{ activePanel.intro }}</p>
      <ul class="mb-4">
        <li v-for="point in activePanel.points" :key="point">{{ point }}</li>
      </ul>

      <div v-if="sent === activePanel.title" class="alert alert-success" role="status">
        <p class="fw-bold mb-1">Thank you, we have that</p>
        <p class="mb-0 small">
          Someone gets back to you within two business days if you asked for a
          reply. If you did not, nothing further happens and nothing is stored
          against your name.
        </p>
      </div>

      <form v-else novalidate @submit.prevent="send">
        <ErrorSummary id="error-summary" :errors="summary" />

        <BaseTextarea
          id="message"
          v-model="values.message"
          label="Your message"
          :hint="activePanel.prompt"
          :maxlength="ENQUIRY_MESSAGE_MAX"
          :rows="5"
          required
          :error="errors.message"
          @blur="form.touch('message')"
        />

        <BaseField
          id="name"
          v-model="values.name"
          label="Name"
          hint="Whatever you would like us to call you. A first name is plenty."
          maxlength="60"
          :error="errors.name"
          @blur="form.touch('name')"
        />

        <BaseCheckbox
          id="wantsReply"
          v-model="values.wantsReply"
          label="I would like a reply"
          description="Leave this off and we keep no way to contact you."
        />

        <BaseField
          v-if="values.wantsReply"
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

        <button type="submit" class="btn-iris" :disabled="submitting">
          {{ submitting ? 'Sending...' : activePanel.cta }}
        </button>
      </form>
    </section>

    <section v-if="openPanel === 'donate'" class="panel" aria-labelledby="donate">
      <h2 id="donate" class="h5 mb-2">
        <i class="bi bi-heart-fill" aria-hidden="true"></i> Donate
      </h2>
      <p>
        Donations pay for counselling hours, interpreters and the annual review
        that keeps the directory honest. We are a registered charity and gifts
        over two dollars are tax deductible.
      </p>

      <dl class="donate-list">
        <div><dt>$25</dt><dd>An interpreter for one appointment</dd></div>
        <div><dt>$80</dt><dd>One counselling session for someone who cannot pay</dd></div>
        <div><dt>$200</dt><dd>A month of peer group facilitation</dd></div>
      </dl>

      <DonationForm />
    </section>
  </div>
</template>

<style scoped>
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

.panel {
  padding: 1.4rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
}

.donate-list {
  margin: 0 0 1.25rem;
}

.donate-list > div {
  display: flex;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--iris-border);
}

.donate-list dt {
  flex: 0 0 4rem;
  font-weight: 700;
  color: var(--iris-purple-900);
}

.donate-list dd {
  margin: 0;
}

.callout {
  padding: 1rem 1.15rem;
  border-left: 4px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-purple-50);
  font-size: 0.92rem;
}
</style>
