<script setup>
import AboutNav from '@/components/about/AboutNav.vue'

/* our story, services, team and how listings are vetted.

   the vetting section is the one that matters. the A1 research found people do
   not trust an unvetted inclusive label, so saying out loud that providers
   cannot pay to appear is the whole point of having a directory. */

const services = [
  {
    name: 'Individual counselling',
    detail: 'One to one sessions with an affirming counsellor, by telehealth or in person.',
  },
  {
    name: 'Peer navigation',
    detail:
      'Half an hour with a peer worker who has been through the system, to help you find the right service and prepare for a first appointment.',
  },
  {
    name: 'Peer support groups',
    detail:
      'Regular facilitated groups for trans and gender diverse people, and for LGBTIQ+ people over 50.',
  },
  {
    name: 'The affirming care directory',
    detail:
      'A vetted list of GPs and allied health providers, filterable by accreditation, approach and access needs.',
  },
  {
    name: 'Resources and education',
    detail:
      'Plain language health guides, material for families and allies, and translated resources in community languages.',
  },
]

const team = [
  {
    photo: '/images/a-kaur.jpeg',
    name: 'A. Kaur',
    role: 'Counselling Psychologist',
    detail:
      'Registered with AHPRA, working from an informed consent model. Runs our individual counselling sessions.',
  },
  {
    photo: '/images/j-okafor.jpeg',
    name: 'J. Okafor',
    role: 'Peer Navigator',
    detail:
      'Peer worker with lived experience of the health system. Helps people work out where to start and what to expect.',
  },
  {
    photo: '/images/m-rivera.jpeg',
    name: 'M. Rivera',
    role: 'Group Facilitator',
    detail:
      'Facilitates the trans and gender diverse peer group, a space where you can come as often or as rarely as you like.',
  },
  {
    photo: '/images/d-fraser.jpeg',
    name: 'D. Fraser',
    role: 'Group Facilitator',
    detail: 'Runs the over 50s connection group, including for members living with HIV.',
  },
]

const criteria = [
  'Rainbow Tick accreditation, or equivalent evidence of inclusive practice',
  'An informed consent approach to gender affirming care',
  'Physical and communication access information',
  'Feedback from community members who have used the service',
]
</script>

<template>
  <div class="container py-4 py-lg-5">
    <img src="/images/about.jpeg" alt="" class="page-image" fetchpriority="high" />

    <h1 class="mb-2">About us</h1>
    <p class="hero-lead mb-4">
      Who we are, what we do, and how a provider earns a place in our directory.
    </p>

    <AboutNav />

    <section class="mb-5" aria-labelledby="story">
      <h2 id="story" class="section-heading">Our story</h2>
      <p>
        Iris Health Collective started in 2016 around a kitchen table in Brunswick.
        A counsellor, two peer workers and a GP were tired of watching people travel
        across Melbourne to reach care that would not misgender them.
      </p>
      <p>
        We began as a phone list of trusted practitioners, passed between friends.
        It grew because that list solved a real problem: knowing in advance that a
        service is safe, rather than finding out the hard way.
      </p>
      <p class="mb-0">
        Today we are a registered charity providing counselling, peer support and
        vetted referrals to affirming GPs across Victoria. The phone list is still
        the heart of it, only now it is a directory anyone can search without
        giving us their name.
      </p>
    </section>

    <section class="mb-5" aria-labelledby="what-we-do">
      <h2 id="what-we-do" class="section-heading">What we do</h2>
      <dl class="service-list">
        <div v-for="service in services" :key="service.name" class="service-list__item">
          <dt>{{ service.name }}</dt>
          <dd>{{ service.detail }}</dd>
        </div>
      </dl>
    </section>

    <section class="mb-5" aria-labelledby="team">
      <h2 id="team" class="section-heading">Our team</h2>

      <div class="team-grid">
        <article v-for="member in team" :key="member.name" class="team-card">
          <img :src="member.photo" alt="" class="team-card__avatar" loading="lazy" />
          <div>
            <h3 class="h6 mb-0">{{ member.name }}</h3>
            <p class="team-card__role mb-2">{{ member.role }}</p>
            <p class="mb-0 small">{{ member.detail }}</p>
          </div>
        </article>
      </div>

      <p class="mt-3 mb-0">
        Behind the four of them sit a community engagement coordinator, an
        operations manager, around forty volunteers, and a board of seven with a
        majority of LGBTIQ+ directors.
      </p>
    </section>

    <section aria-labelledby="vetting">
      <h2 id="vetting" class="section-heading">How we vet providers</h2>

      <p class="callout">
        Providers apply to be listed. They do not pay to appear, and they cannot
        pay to rank higher.
      </p>

      <p>Every listing is assessed against four things:</p>
      <ul class="mb-3">
        <li v-for="item in criteria" :key="item">{{ item }}</li>
      </ul>

      <p class="mb-0">
        Each listing states plainly why that provider is included. Listings are
        reviewed annually, and any provider can be removed if community feedback
        tells us the practice has changed.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--iris-radius-md);
  margin-bottom: 1.5rem;
}

.service-list {
  margin: 0;
}

.service-list__item {
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.service-list dt {
  font-weight: 700;
  color: var(--iris-purple-900);
}

.service-list dd {
  margin: 0.25rem 0 0;
}

.team-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .team-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.team-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.15rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
}

/* alt is empty on purpose. the name sits right beside the photo, so describing
   it again just makes a screen reader read the person twice */
.team-card__avatar {
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--iris-purple-50);
}

.team-card__role {
  font-size: 0.9rem;
  color: var(--iris-ink-muted);
}

.callout {
  padding: 1rem 1.15rem;
  border-left: 4px solid var(--iris-purple-900);
  border-radius: var(--iris-radius-sm);
  background: var(--iris-purple-50);
  font-weight: 600;
}
</style>
