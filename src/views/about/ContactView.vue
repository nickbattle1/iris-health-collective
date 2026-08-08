<script setup>
import AboutNav from '@/components/about/AboutNav.vue'

/* contact, feedback and complaints.

   every number and address here is a real link. someone on a phone should be
   able to press the number rather than write it down, and someone using a
   screen reader should hear where an external link goes before they follow it. */

const complaintSteps = [
  'We acknowledge your complaint within two business days',
  'A staff member not involved in the issue reviews what happened',
  'We contact you to check we have understood it correctly',
  'We respond with an outcome within 20 business days',
]

const escalation = [
  {
    name: 'Health Complaints Commissioner (Victoria)',
    about: 'Complaints about health services and health information.',
    phone: '1300 582 113',
    tel: '1300582113',
    site: 'hcc.vic.gov.au',
    url: 'https://hcc.vic.gov.au',
  },
  {
    name: 'Office of the Australian Information Commissioner',
    about: 'Privacy complaints.',
    phone: '1300 363 992',
    tel: '1300363992',
    site: 'oaic.gov.au',
    url: 'https://www.oaic.gov.au',
  },
  {
    name: 'Victorian Equal Opportunity and Human Rights Commission',
    about: 'Discrimination complaints.',
    phone: '1300 292 153',
    tel: '1300292153',
    site: 'humanrights.vic.gov.au',
    url: 'https://www.humanrights.vic.gov.au',
  },
]
</script>

<template>
  <div class="container py-4 py-lg-5">
    <h1 class="mb-2">Contact us</h1>
    <p class="hero-lead mb-4">
      Enquiries, feedback about a provider, and how to make a complaint.
    </p>

    <AboutNav />

    <section class="mb-5" aria-labelledby="enquiries">
      <h2 id="enquiries" class="section-heading">General enquiries</h2>

      <dl class="contact-list">
        <div class="contact-list__item">
          <dt><i class="bi bi-telephone-fill" aria-hidden="true"></i> Phone</dt>
          <dd>
            <a href="tel:+61394150999">(03) 9415 0999</a>
            <span class="d-block small text-muted">Monday to Friday, 9am to 5pm</span>
          </dd>
        </div>

        <div class="contact-list__item">
          <dt><i class="bi bi-envelope-fill" aria-hidden="true"></i> Email</dt>
          <dd>
            <a href="mailto:hello@irishealth.org.au">hello@irishealth.org.au</a>
          </dd>
        </div>

        <div class="contact-list__item">
          <dt><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> Address</dt>
          <dd>Ground floor, 214 Brunswick Street, Fitzroy VIC 3065</dd>
        </div>
      </dl>

      <p class="mb-0">
        We aim to answer emails within two business days. You do not have to give
        us your legal name to get in touch.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="feedback">
      <h2 id="feedback" class="section-heading">Giving feedback</h2>
      <p>
        Feedback about a listed provider changes our directory. If a practice
        treated you well, or did not, we want to know.
      </p>
      <p class="mb-0">
        You can send feedback anonymously by leaving the contact fields blank.
        That means we cannot follow up or tell you what came of it.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="complaints">
      <h2 id="complaints" class="section-heading">Making a complaint</h2>
      <p>
        You can complain about a service you received from us, a staff member or
        volunteer, a provider in our directory, or the way we have handled your
        information.
      </p>

      <ol class="mb-3">
        <li v-for="step in complaintSteps" :key="step">{{ step }}</li>
      </ol>

      <p class="callout mb-0">
        You can complain anonymously, or ask a friend or advocate to complain for
        you. Making a complaint will not affect your access to our services.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="escalate">
      <h2 id="escalate" class="section-heading">If you are not satisfied with our response</h2>

      <article v-for="body in escalation" :key="body.name" class="escalate-card">
        <h3 class="h6 mb-1">{{ body.name }}</h3>
        <p class="small text-muted mb-2">{{ body.about }}</p>
        <p class="mb-0 small">
          <a :href="`tel:${body.tel}`">{{ body.phone }}</a>
          <span aria-hidden="true"> &middot; </span>
          <a :href="body.url" target="_blank" rel="noopener noreferrer">
            {{ body.site }}<span class="visually-hidden">, opens in a new tab</span>
          </a>
        </p>
      </article>
    </section>

    <section aria-labelledby="accessibility">
      <h2 id="accessibility" class="section-heading">Accessibility</h2>
      <p>
        If any part of this site is difficult to use, tell us and we will fix it.
        We can supply any resource in large print, plain text or Easy English, and
        we will arrange an interpreter at no cost.
      </p>
      <p class="mb-0">
        <strong>National Relay Service</strong> users can call
        <a href="tel:133677">133 677</a> and ask for our number.
      </p>
    </section>
  </div>
</template>

<style scoped>
.contact-list {
  margin: 0 0 1.25rem;
}

.contact-list__item {
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.contact-list dt {
  font-weight: 700;
  color: var(--iris-purple-900);
}

.contact-list dd {
  margin: 0.25rem 0 0;
}

/* the whole row is the tap target on a phone, not just the text */
.contact-list a {
  display: inline-block;
  min-height: var(--iris-target);
  padding: 0.5rem 0;
  font-weight: 600;
}

.escalate-card {
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
}

.callout {
  padding: 1rem 1.15rem;
  border-left: 4px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-purple-50);
  font-weight: 600;
}
</style>
