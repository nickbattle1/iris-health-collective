<script setup>
import { computed, useId } from 'vue'

// same wiring as BaseField, for a dropdown. a real select rather than a styled
// listbox, so it gets the native picker on a phone and arrow keys everywhere
// else without any of it being reimplemented here

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true }, // [{ value, label }]
  id: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'blur'])

const generated = useId()
const fieldId = computed(() => props.id || generated)
const hintId = computed(() => (props.hint ? `${fieldId.value}-hint` : null))
const errorId = computed(() => (props.error ? `${fieldId.value}-error` : null))

const describedBy = computed(
  () => [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div class="mb-3">
    <label :for="fieldId" class="form-label fw-semibold">
      {{ label }}
      <span v-if="required" class="required-mark" aria-hidden="true">*</span>
    </label>

    <p v-if="hint" :id="hintId" class="form-text mt-0 mb-2">{{ hint }}</p>

    <select
      :id="fieldId"
      :value="modelValue"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="form-select form-select-lg"
      :class="{ 'is-invalid': error }"
      @change="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <p v-if="error" :id="errorId" class="invalid-feedback d-block mb-0">
      <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {{ error }}
    </p>
  </div>
</template>
