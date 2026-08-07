<script setup>
// the 1 2 3 marker from figure 3 of the design report.
//
// ordered list rather than three divs so the structure carries "step 2 of 3".
// current step gets aria-current, completed ones say so in text and not just
// with a tick and a colour

defineProps({
  current: { type: Number, required: true },
})

const steps = [
  { number: 1, label: 'Service' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Confirm' },
]
</script>

<template>
  <nav aria-label="Booking progress" class="mb-4">
    <ol class="step-list">
      <li
        v-for="step in steps"
        :key="step.number"
        class="step"
        :class="{ 'is-current': step.number === current, 'is-done': step.number < current }"
      >
        <span class="step__dot" aria-hidden="true">
          <i v-if="step.number < current" class="bi bi-check-lg"></i>
          <template v-else>{{ step.number }}</template>
        </span>
        <span class="step__label" :aria-current="step.number === current ? 'step' : undefined">
          {{ step.label }}
          <span class="visually-hidden">
            , step {{ step.number }} of 3<template v-if="step.number < current">, completed</template>
          </span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.step-list {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  max-width: 26rem;
  margin: 0 auto;
  padding: 0;
  list-style: none;
  counter-reset: none;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  text-align: center;
}

/* connecting line sits behind the dots, drawn backwards from each step so the
   last one doesn't trail off the end */
.step + .step::before {
  content: '';
  position: absolute;
  top: 19px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: var(--iris-border);
}

.step.is-current::before,
.step.is-done::before {
  background: var(--iris-purple-900);
}

.step__dot {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--iris-border);
  background: var(--iris-surface);
  color: var(--iris-ink-muted);
  font-weight: 700;
}

.step.is-current .step__dot,
.step.is-done .step__dot {
  background: var(--iris-purple-900);
  border-color: var(--iris-purple-900);
  color: #fff;
}

.step__label {
  margin-top: 0.4rem;
  font-size: 0.9rem;
  color: var(--iris-ink-muted);
}

.step.is-current .step__label {
  color: var(--iris-purple-900);
  font-weight: 700;
}
</style>
