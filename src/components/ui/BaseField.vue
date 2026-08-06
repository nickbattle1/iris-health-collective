<script setup>
import { computed, useId } from 'vue'

/* one labelled input with its hint and error wired up properly.
   every form in the app uses this, so the aria plumbing is written once and
   cannot drift between screens. */

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Boolean], default: '' },
  type: { type: String, default: 'text' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})

defineEmits(['update:modelValue', 'blur'])

const id = useId()
const hintId = computed(() => (props.hint ? `${id}-hint` : null))
const errorId = computed(() => (props.error ? `${id}-error` : null))

// aria-describedby takes a space separated list, drop the empties
const describedBy = computed(() => [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="mb-3">
    <label :for="id" class="form-label fw-semibold">
      {{ label }}
      <span v-if="!required" class="fw-normal text-muted">(optional)</span>
    </label>

    <p v-if="hint" :id="hintId" class="form-text mt-0 mb-2">{{ hint }}</p>

    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="form-control form-control-lg"
      :class="{ 'is-invalid': error }"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />

    <p v-if="error" :id="errorId" class="invalid-feedback d-block mb-0">
      <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {{ error }}
    </p>
  </div>
</template>
