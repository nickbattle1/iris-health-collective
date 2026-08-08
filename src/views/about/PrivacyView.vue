<script setup>
import AboutNav from '@/components/about/AboutNav.vue'

/* the plain language privacy and safety policy the A1 sitemap links from every
   page footer.

   written to be read rather than to cover us. the short version at the top is
   the whole policy in five lines, because someone checking whether it is safe
   to use this site on a shared laptop is not going to read two thousand words
   first. */

const lastUpdated = '8 August 2026'

const shortVersion = [
  'You can browse this entire site, including the directory and all resources, without an account',
  'We never ask for your gender, sexuality or HIV status to make a booking',
  'Your chosen name is what we use everywhere, including reminders and staff screens',
  'Reminders are off unless you turn them on, and they never name us',
  'You can delete everything we hold about you in one tap, at any time',
]

const collected = [
  {
    when: 'To book a session',
    what: 'A chosen name, a contact method for confirmation, and the service and time you want. Pronouns are optional and self-described.',
  },
  {
    when: 'For a Medicare rebate',
    what: 'Your legal name and Medicare number, because Services Australia requires them. That is the only reason we ever ask, and we say so at the point we ask.',
  },
  {
    when: 'For an optional account',
    what: 'An email address or pseudonym, your bookings and your reminder settings.',
  },
]

const limits = [
  'A serious and immediate risk to your life or someone else\u2019s',
  'Where child safety law obliges our staff to report a reasonable belief that a child is at risk of harm',
  'Where a court or tribunal legally compels us to produce records',
]
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Privacy and safety</h1>
    <p class="hero-lead mb-4">
      What we collect, what we deliberately do not, and how to remove it.
    </p>

    <AboutNav />

    <section class="short-version mb-5" aria-labelledby="short">
      <h2 id="short" class="h5 mb-3">The short version</h2>
      <ul class="mb-0">
        <li v-for="line in shortVersion" :key="line">{{ line }}</li>
      </ul>
    </section>

    <section class="mb-5" aria-labelledby="browsing">
      <h2 id="browsing" class="section-heading">Browsing without an account</h2>
      <p>
        Searching the directory, reading a provider profile, browsing resources
        and viewing crisis contacts all work with no account and no sign-in prompt.
      </p>
      <p class="mb-0">
        We do not place advertising or tracking cookies, and we do not use
        analytics that build a profile of you. The only cookies we set keep the
        site working during your visit.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="collect">
      <h2 id="collect" class="section-heading">What we collect</h2>
      <dl class="detail-list">
        <div v-for="item in collected" :key="item.when" class="detail-list__item">
          <dt>{{ item.when }}</dt>
          <dd>{{ item.what }}</dd>
        </div>
      </dl>
    </section>

    <section class="mb-5" aria-labelledby="not-asked">
      <h2 id="not-asked" class="section-heading">What we deliberately do not ask</h2>
      <p>
        There is no gender field on our booking form. A booking does not use that
        information, so collecting it would add disclosure risk with no benefit to
        your care.
      </p>
      <p class="mb-0">
        We also do not ask about your sexuality, HIV status, relationship status
        or immigration status. What you share with your practitioner in session is
        up to you.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="names">
      <h2 id="names" class="section-heading">Chosen name and legal name</h2>
      <p>These are separate fields and they stay separate.</p>
      <p class="mb-0">
        Your chosen name appears on your confirmation, on any reminder, on the
        practitioner's screen and in the waiting area. Legal details, where a
        rebate requires them, sit against the billing record only.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="reminders">
      <h2 id="reminders" class="section-heading">Reminders and what shows on your phone</h2>
      <p class="mb-0">
        Reminders are off by default. If you turn them on, an SMS shows the date,
        time and location only, with no service, practitioner or organisation
        name. Email comes from a neutral sender that does not identify us in the
        sender field or subject line. You can change or switch off reminders at
        any time.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="shared-device">
      <h2 id="shared-device" class="section-heading">Safety on a shared device</h2>
      <p>
        The <strong>Exit Site</strong> button sits in the header of every page.
        Pressing it, or pressing Esc, replaces the current tab with a neutral
        website and removes this site from your back button history.
      </p>
      <p class="mb-0">
        It cannot erase your full browser history or undo a saved password. Our
        digital safety guide covers private browsing, clearing history and
        checking what your browser has stored.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="who-sees">
      <h2 id="who-sees" class="section-heading">Who can see your information</h2>
      <p>
        Your practitioner and a small number of administrative staff, with access
        limited by role and every access logged.
      </p>
      <p class="mb-0">
        Providers in our directory cannot see that you viewed their profile. They
        only receive your details if you book with them. We do not sell your
        information, and we never will.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="limits">
      <h2 id="limits" class="section-heading">Limits to confidentiality</h2>
      <p>
        Three narrow situations may require us to share information without your
        consent. We will tell you when we can, and share only what is needed:
      </p>
      <ol class="mb-3">
        <li v-for="limit in limits" :key="limit">{{ limit }}</li>
      </ol>
      <p class="callout mb-0">
        Being trans, being under 18, questioning your identity or living with HIV
        are not reasons to contact anyone about you.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="retention">
      <h2 id="retention" class="section-heading">Keeping and deleting your data</h2>
      <p>
        Counselling records are held for seven years after your last session, or
        until your 25th birthday if you were under 18 at the time. Victorian
        health records law sets both periods and we cannot shorten them.
      </p>
      <p>
        Everything else, including your account, reminder settings and booking
        history, is deleted the moment you ask.
        <RouterLink to="/account/privacy">My account</RouterLink> has a
        <strong>Delete my data</strong> button. Deletion is immediate and cannot
        be undone, and you will see confirmation of exactly what was removed.
      </p>
      <p class="mb-0">
        Your information is encrypted in transit and at rest, and stored on
        servers in Australia.
      </p>
    </section>

    <section aria-labelledby="rights">
      <h2 id="rights" class="section-heading">Your rights</h2>
      <p>
        You can ask what we hold about you, ask us to correct it, and ask us to
        delete it. Requests are free and we will respond within 30 days.
      </p>
      <p>
        If you think we have mishandled your information,
        <RouterLink to="/about/contact">tell us first</RouterLink>. If you are not
        satisfied, you can take it to the Office of the Australian Information
        Commissioner on <a href="tel:1300363992">1300 363 992</a> or at
        <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
          oaic.gov.au<span class="visually-hidden">, opens in a new tab</span>
        </a>.
      </p>
      <p class="text-muted small mb-0">Last updated: {{ lastUpdated }}</p>
    </section>
  </div>
</template>

<style scoped>
.short-version {
  padding: 1.25rem 1.4rem;
  border: 1px solid var(--iris-purple-100);
  border-radius: var(--iris-radius-md);
  background: var(--iris-purple-50);
}

.short-version h2 {
  color: var(--iris-purple-900);
}

.detail-list {
  margin: 0;
}

.detail-list__item {
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.detail-list dt {
  font-weight: 700;
  color: var(--iris-purple-900);
}

.detail-list dd {
  margin: 0.25rem 0 0;
}

.callout {
  padding: 1rem 1.15rem;
  border-left: 4px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-purple-50);
  font-weight: 600;
}
</style>
