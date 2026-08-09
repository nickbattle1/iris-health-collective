<script setup>
import {
  ALWAYS_OPEN, COMMUNITY_SPECIFIC, TRIAGE, ONLINE, INTERNATIONAL,
} from '@/constants/supportServices'

/* the page behind "more support options" on the crisis screen.

   ordered by what someone in trouble needs first. always open at the top,
   because QLife closes at midnight and this page exists for the hours it is
   shut. community specific next, then acute assessment, then reading, then
   overseas.

   every number is a tel: link and every one is real. this is the one page on
   the site where being wrong would matter. */
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 760px">
    <RouterLink to="/crisis" class="d-inline-block mb-3">
      <i class="bi bi-chevron-left" aria-hidden="true"></i> Back to crisis support
    </RouterLink>

    <h1 class="mb-2">More support options</h1>
    <p class="hero-lead mb-4">
      Every service here is free and confidential. You do not have to be in
      crisis to call one, and you do not have to give your name.
    </p>

    <p class="emergency" role="note">
      <strong>In an emergency, call <a href="tel:000">000</a>.</strong>
      Ambulance, police and fire. You do not need to give your name to get help.
    </p>

    <section class="mb-5" aria-labelledby="always-open">
      <h2 id="always-open" class="section-heading">Open right now, whatever the hour</h2>
      <p class="mb-3">
        QLife runs from 3pm to midnight. These four do not close, so start here
        if it is the middle of the night.
      </p>

      <article v-for="service in ALWAYS_OPEN" :key="service.name" class="service">
        <div class="service__body">
          <h3 class="h6 mb-1">{{ service.name }}</h3>
          <p class="mb-1 small">{{ service.detail }}</p>
          <p class="service__hours mb-0">{{ service.hours }}</p>
        </div>
        <div class="service__actions">
          <a :href="`tel:${service.tel}`" class="btn-iris service__call">{{ service.phone }}</a>
          <a :href="service.url" target="_blank" rel="noopener noreferrer" class="small">
            Website<span class="visually-hidden">, opens in a new tab</span>
          </a>
        </div>
      </article>
    </section>

    <section class="mb-5" aria-labelledby="community">
      <h2 id="community" class="section-heading">For our communities</h2>

      <article v-for="service in COMMUNITY_SPECIFIC" :key="service.name" class="service">
        <div class="service__body">
          <h3 class="h6 mb-1">{{ service.name }}</h3>
          <p class="mb-1 small">{{ service.detail }}</p>
          <p class="service__hours mb-0">{{ service.hours }}</p>
        </div>
        <div class="service__actions">
          <a :href="`tel:${service.tel}`" class="btn-iris service__call">{{ service.phone }}</a>
          <a :href="service.url" target="_blank" rel="noopener noreferrer" class="small">
            Website<span class="visually-hidden">, opens in a new tab</span>
          </a>
        </div>
      </article>
    </section>

    <section class="mb-5" aria-labelledby="triage">
      <h2 id="triage" class="section-heading">Mental health triage</h2>
      <p class="mb-3">
        For an urgent assessment when someone needs to be seen rather than
        talked to. Victoria is listed first, then everywhere else.
      </p>

      <dl class="triage">
        <div v-for="line in TRIAGE" :key="line.state" class="triage__row">
          <dt>{{ line.state }}</dt>
          <dd>
            <a v-if="line.tel" :href="`tel:${line.tel}`">{{ line.phone }}</a>
            <a
              v-if="line.url"
              :href="line.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              Find your service<span class="visually-hidden">, opens in a new tab</span>
            </a>
            <span v-if="line.detail" class="d-block small text-muted">{{ line.detail }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <section class="mb-5" aria-labelledby="online">
      <h2 id="online" class="section-heading">Online</h2>
      <ul class="link-list">
        <li v-for="item in ONLINE" :key="item.name">
          <a :href="item.url" target="_blank" rel="noopener noreferrer">
            {{ item.name }}<span class="visually-hidden">, opens in a new tab</span>
          </a>
          <span class="d-block small text-muted">{{ item.detail }}</span>
        </li>
      </ul>
    </section>

    <section aria-labelledby="international">
      <h2 id="international" class="section-heading">Outside Australia</h2>
      <ul class="link-list">
        <li v-for="item in INTERNATIONAL" :key="item.name">
          <a :href="item.url" target="_blank" rel="noopener noreferrer">
            {{ item.name }}<span class="visually-hidden">, opens in a new tab</span>
          </a>
          <span class="d-block small text-muted">{{ item.detail }}</span>
        </li>
      </ul>
    </section>

    <p class="text-muted small border rounded p-3 mt-4">
      Iris Health Collective is a fictional service built for a university
      assessment. Every service listed on this page is real, and the numbers are
      the ones each one publishes. The list follows the one maintained by
      <a href="https://qlife.org.au/get-help" target="_blank" rel="noopener noreferrer">
        QLife<span class="visually-hidden">, opens in a new tab</span></a>.
    </p>
  </div>
</template>

<style scoped>
.emergency {
  padding: 1rem 1.15rem;
  margin-bottom: 2rem;
  border-left: 4px solid var(--iris-pink, #d94f7d);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-surface-muted);
}

/* the actions column is a fixed width at every card, so the call buttons form
   a straight edge down the page instead of landing wherever the text left off.
   without it a long description pushed the button onto its own line and the
   next card kept it inline, which is what made the list look unfinished. */
.service {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
}

.service__body {
  flex: 1;
  min-width: 0;
}

.service__hours {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--iris-purple-900);
}

.service__actions {
  flex: 0 0 12rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.service__call {
  width: 100%;
  text-align: center;
  white-space: nowrap;
}

/* stacked on a phone, where a 12rem column beside the text leaves neither
   enough room */
@media (max-width: 575.98px) {
  .service {
    flex-direction: column;
    align-items: stretch;
  }

  .service__actions {
    flex: 1 1 auto;
  }
}

.triage {
  margin: 0;
}

.triage__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 2rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--iris-border);
}

/* both the label and the link are 48px boxes with their text centred inside.
   padding on its own left the text at the top of the target and dumped the
   spare 24px underneath, which is what made the number only rows look like
   they had a hole in them. */
/* wide enough for Australian Capital Territory on one line. the page is 760px
   so there is room for it, and a wrapped label next to a single line number
   reads like something went wrong. */
.triage dt {
  flex: 0 0 17rem;
  display: flex;
  align-items: center;
  min-height: var(--iris-target);
  font-weight: 700;
}

.triage dd {
  margin: 0;
}

/* the whole row is the target on a phone, not just the digits */
.triage a,
.link-list a {
  display: inline-flex;
  align-items: center;
  min-height: var(--iris-target);
  font-weight: 600;
}

/* on a phone the 13rem label column plus a number just fits, so most rows sit
   inline and the two with a second line of detail wrap underneath. stack every
   row instead, so there is one shape rather than two */
/* stacked on a phone, where the label column plus a number just fits and the
   two rows carrying a second line wrapped underneath while the rest stayed
   inline. one shape for every row beats two. */
@media (max-width: 575.98px) {
  .triage__row {
    flex-direction: column;
    gap: 0;
  }

  /* stacked, the state carries the row on its own rather than sitting beside
     a number, so it needs to outweigh the link under it */
  .triage dt {
    flex: 1 1 auto;
    min-height: 2rem;
    font-size: 1.1rem;
  }
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-list li {
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--iris-border);
}
</style>
