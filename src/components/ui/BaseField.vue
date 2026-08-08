<script setup>
import { computed, useId } from 'vue'

// one labelled input with its hint and error wired up. every form uses this so
// the aria plumbing is written once and can't drift.
//
// id prop is new: the error summary links to #field, so the booking form has
// to name its inputs rather than take a generated one

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Boolean], default: '' },
  id: { type: String, default: '' },
  type: { type: String, default: 'text' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  inputmode: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})

defineEmits(['update:modelValue', 'blur'])

const generated = useId()
const fieldId = computed(() => props.id || generated)
const hintId = computed(() => (props.hint ? `${fieldId.value}-hint` : null))
const errorId = computed(() => (props.error ? `${fieldId.value}-error` : null))

// aria-describedby is a space separated list, drop the empties
const describedBy = computed(
  () => [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div class="mb-3">
    <div class="label-row">
      <label :for="fieldId" class="form-label fw-semibold mb-0">
        {{ label }}
        <span v-if="required" class="required-mark" aria-hidden="true">*</span>
        <span v-else class="fw-normal text-muted">(optional)</span>
      </label>
      <slot name="labelAction"></slot>
    </div>

    <p v-if="hint" :id="hintId" class="form-text mt-0 mb-2">{{ hint }}</p>

    <slot name="beforeInput"></slot>

    <input
      :id="fieldId"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :inputmode="inputmode || undefined"
      :maxlength="maxlength"
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

<style scoped>
/* label on the left, the why we ask link right aligned on the same line, the
   way it sits in the wireframe. wraps rather than squashing on a narrow phone */
.label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
</style>
