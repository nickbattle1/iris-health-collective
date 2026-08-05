<script setup>
import { RouterLink } from 'vue-router'

/* crisis screen from the design report, User story-7. one tap from any page, no login,
   hours stated so nobody rings into silence.
   these numbers are real, check qlife.org.au before submitting.*/

const options = [
  {
    href: 'tel:1800184527',
    icon: 'bi-telephone-fill',
    label: 'Call 1800 184 527',
    meta: 'QLife, 3pm to midnight, every day',
  },
  {
    href: 'https://qlife.org.au/resources/chat',
    icon: 'bi-chat-dots-fill',
    label: 'Open QLife webchat',
    meta: 'QLife, 3pm to midnight, every day',
    external: true,
  },
]
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 720px">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <RouterLink to="/" class="fw-semibold">
        <i class="bi bi-chevron-left" aria-hidden="true"></i> Back
      </RouterLink>
      <h1 class="h4 mb-0">Need support now?</h1>
      <span aria-hidden="true" style="width: 3rem"></span>
    </div>

    <section class="crisis-card mb-4" aria-labelledby="crisis-heading">
      <h2 id="crisis-heading" class="h2 text-white mb-3">
        You are not alone.<br />Help is available.
      </h2>
      <p class="mb-4" style="opacity: 0.92">
        Connect with LGBTIQ+ specialist peer support services.
      </p>

      <a
        v-for="option in options"
        :key="option.href"
        :href="option.href"
        class="crisis-option"
        :target="option.external ? '_blank' : undefined"
        :rel="option.external ? 'noopener noreferrer' : undefined"
      >
        <span
          class="d-inline-flex align-items-center justify-content-center flex-shrink-0"
          aria-hidden="true"
          style="
            width: 44px;
            height: 44px;
            background: var(--iris-surface-muted);
            border-radius: 10px;
          "
        >
          <i class="bi fs-5" :class="option.icon" style="color: var(--iris-purple-900)"></i>
        </span>
        <span>
          <span class="crisis-option__label">{{ option.label }}</span>
          <span class="crisis-option__meta">{{ option.meta }}</span>
        </span>
      </a>

      <RouterLink to="/resources" class="btn-iris-light w-100">
        More support options
      </RouterLink>
    </section>

    <p class="emergency-line text-center mb-2">In an emergency, call 000</p>
    <p class="text-center text-muted">You do not need to give your name to get help.</p>
  </div>
</template>
