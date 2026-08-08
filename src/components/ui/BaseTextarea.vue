<script setup>
import { computed, useId } from 'vue'

// same wiring as BaseField for the one multi line field. the counter is the
// visible half of the range rule, you can see you're near the limit before the
// schema tells you you're past it.
//
// live region only switches on near the end. announcing every keystroke would
// make this unusable with a screen reader

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  id: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  rows: { type: [String, Number], default: 4 },
  maxlength: { type: Number, default: 300 },
  required: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'blur'])

const generated = useId()
const fieldId = computed(() => props.id || generated)
const hintId = computed(() => (props.hint ? `${fieldId.value}-hint` : null))
const countId = computed(() => `${fieldId.value}-count`)
const errorId = computed(() => (props.error ? `${fieldId.value}-error` : null))

const used = computed(() => props.modelValue?.length ?? 0)
const remaining = computed(() => props.maxlength - used.value)
const nearLimit = computed(() => remaining.value <= 40)

const describedBy = computed(
  () => [hintId.value, countId.value, errorId.value].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div class="mb-3">
    <label :for="fieldId" class="form-label fw-semibold">
      {{ label }}
      <span v-if="required" class="required-mark" aria-hidden="true">*</span>
      <span v-else class="fw-normal text-muted">(optional)</span>
    </label>

    <p v-if="hint" :id="hintId" class="form-text mt-0 mb-2">{{ hint }}</p>

    <textarea
      :id="fieldId"
      :value="modelValue"
      :rows="rows"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="form-control form-control-lg"
      :class="{ 'is-invalid': error }"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    ></textarea>

    <p
      :id="countId"
      class="form-text mb-0"
      :class="{ 'text-danger fw-semibold': remaining < 0 }"
      role="status"
      :aria-live="nearLimit ? 'polite' : 'off'"
    >
      <span v-if="remaining >= 0">{{ remaining }} characters left</span>
      <span v-else>{{ -remaining }} characters over the limit</span>
    </p>

    <p v-if="error" :id="errorId" class="invalid-feedback d-block mb-0">
      <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {{ error }}
    </p>
  </div>
</template>
