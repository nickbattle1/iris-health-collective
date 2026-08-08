<script setup>
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <p class="site-footer__mission">
        We exist to improve the health and wellbeing of LGBTIQ+ Victorians.
      </p>

      <section class="ack" aria-labelledby="ack-country">
        <div class="ack__head">
          <h2 id="ack-country" class="ack__title">Acknowledgement of Country</h2>
          <img
            src="/images/aboriginal-torres-strait-flags.png"
            alt="Aboriginal and Torres Strait Islander flags"
            class="ack__flag"
          />
        </div>
        <p class="mb-0">
          Iris Health Collective acknowledges the Traditional Owners of country
          throughout Australia, their diversity, histories and knowledge and their
          continuing connection to lands, waters and communities. We pay our
          respects to all Australian Indigenous peoples and their cultures, and to
          Elders of past, present and future generations.
        </p>
      </section>

      <section class="ack" aria-labelledby="ack-elders">
        <div class="ack__head">
          <h2 id="ack-elders" class="ack__title">Acknowledgement of our Elders</h2>
          <img src="/images/rainbow-flag.png" alt="Rainbow pride flag" class="ack__flag" />
        </div>
        <p class="mb-0">
          We pay our respects to those amongst the lesbian, gay, bisexual, trans,
          and intersex communities who have worked to support the improved health
          and wellbeing of their peers, children, families, friends, and country.
          We honour the elders in the diverse communities of which we are a part
          and we celebrate the extraordinary diversity of people's bodies, genders,
          sexualities, and relationships that they represent.
        </p>
      </section>

      <div class="site-footer__cols">
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact" class="site-footer__heading">
            <RouterLink to="/about/contact">Contact us</RouterLink>
          </h2>
          <address class="site-footer__contact">
            <a href="mailto:hello@irishealth.org.au">hello@irishealth.org.au</a>
            <a href="tel:+61394150999">(03) 9415 0999</a>
            <span>Ground floor, 214 Brunswick Street, Fitzroy VIC 3065</span>
          </address>
        </section>

        <nav aria-label="Footer" class="site-footer__nav">
          <RouterLink to="/about">About and privacy</RouterLink>
        </nav>
      </div>

      <p class="site-footer__legal">
        &copy; {{ year }} Iris Health Collective. A fictional charity created for
        Monash University ITO5032. Provider listings are fictional. Crisis contact
        numbers are real.
      </p>
    </div>

    <img src="/images/banner.png" alt="" class="site-footer__banner" />
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 1.5rem;
  padding-top: 2rem;
  background: var(--iris-pink);
  color: #000;
  border-top: 1px solid var(--iris-border);
}

.site-footer__mission {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
}

.ack {
  margin-bottom: 2.25rem;
}

.ack__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.ack__title {
  font-size: 1.05rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #000;
  margin: 0;
}

.ack__flag {
  height: 34px;
  width: auto;
  flex-shrink: 0;
}

.ack p {
  max-width: 60rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

.site-footer__cols {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem 2rem;
}

.site-footer__contact {
  font-style: normal;
  font-size: 0.95rem;
  margin: 0.5rem 0 0;
}

.site-footer__contact a,
.site-footer__contact span {
  display: block;
}

.site-footer__cols a {
  color: #000;
  font-weight: 700;
  text-decoration: underline;
}

.site-footer__heading {
  margin: 0;
  font-size: 1rem;
}

/* the line itself is the tap target on a phone, not just the glyph height */
.site-footer__contact a {
  padding: 0.4rem 0;
  font-weight: 400;
}

.site-footer__legal {
  margin: 1rem 0 2rem;
  font-size: 0.85rem;
}

/* decorative, so alt is empty and it is skipped by a screen reader */
.site-footer__banner {
  display: block;
  width: 100%;
  height: auto;
}

@media (max-width: 575px) {
  .ack__head {
    flex-direction: column;
  }
}
</style>
