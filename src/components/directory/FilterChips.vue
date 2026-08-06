<script setup>
/* one group of toggle chips. real buttons with aria-pressed, not styled divs,
   so a screen reader announces the on/off state. */

defineProps({
  legend: { type: String, required: true },
  options: { type: Object, required: true },  // { code: 'Label' }
  active: { type: Array, required: true },
  variant: { type: String, default: 'solid' }, // solid or outline
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <fieldset class="mb-3 border-0 p-0">
    <legend class="h6 mb-2">{{ legend }}</legend>
    <div class="d-flex flex-wrap gap-2">
      <button
        v-for="(label, code) in options"
        :key="code"
        type="button"
        class="chip"
        :class="[variant === 'solid' ? 'chip--solid' : 'chip--outline', { 'is-on': active.includes(code) }]"
        :aria-pressed="active.includes(code)"
        @click="emit('toggle', code)"
      >
        {{ label }}
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.chip {
  min-height: 44px;
  padding: 0.5rem 1.15rem;
  border-radius: var(--iris-radius-pill);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  border: 2px solid var(--iris-purple-900);
  background: transparent;
  color: var(--iris-purple-900);
}

.chip:hover {
  background: var(--iris-purple-50);
}

.chip.is-on {
  background: var(--iris-purple-900);
  color: #fff;
}

.chip.is-on::before {
  content: '\2713\00a0';
}
</style>
