<script setup>
import { MODALITIES, MODALITY_HINTS } from '@/lib/schemas'

/* only shown for the services offered both ways. before this the booking took
   whichever value the service document carried, so counselling and the over
   50s group both arrived at the practitioner reading "both", which tells
   nobody whether to open a room or send a link.

   two options with a line each, so the same card radio as the service picker
   above rather than a dropdown. */

defineProps({
  options: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <!-- tabindex for the same reason as the time fieldset: a failed continue has
       somewhere to send focus, rather than leaving a keyboard user at the
       bottom of the page with an error they cannot see -->
  <fieldset id="choose-modality" class="border-0 p-0 mb-4" tabindex="-1">
    <legend class="section-heading">How would you like to attend?</legend>

    <div class="modality-grid">
      <div
        v-for="option in options"
        :key="option"
        class="modality-option"
        :class="{ 'is-selected': modelValue === option }"
      >
        <input
          :id="`modality-${option}`"
          class="form-check-input"
          type="radio"
          name="modality"
          :value="option"
          :checked="modelValue === option"
          @change="$emit('update:modelValue', option)"
        />
        <label class="modality-option__body" :for="`modality-${option}`">
          <span class="fw-bold d-block">{{ MODALITIES[option] ?? option }}</span>
          <span class="d-block text-muted small">{{ MODALITY_HINTS[option] }}</span>
        </label>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
#choose-modality {
  scroll-margin-top: 5.5rem;
}

#choose-modality:focus-visible {
  outline: 3px solid var(--iris-purple-900);
  outline-offset: 6px;
  border-radius: var(--iris-radius-sm);
}

.modality-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}

.modality-option {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.15rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.modality-option:hover {
  background: var(--iris-purple-50);
  border-color: var(--iris-purple-500);
}

.modality-option.is-selected {
  border-color: var(--iris-purple-900);
  border-width: 2px;
  background: var(--iris-purple-50);
}

.modality-option .form-check-input {
  width: 1.35rem;
  height: 1.35rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.modality-option .form-check-input:checked {
  background-color: var(--iris-purple-900);
  border-color: var(--iris-purple-900);
}

.modality-option__body {
  cursor: pointer;
  flex: 1;
  min-height: var(--iris-target);
}
</style>
