<script setup>
import { computed, useId } from 'vue'

// real checkbox, real label. these toggles decide whether a contact field is
// required, and a styled div would hide that from anyone not using a mouse

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Boolean, default: false },
  id: { type: String, default: '' },
  description: { type: String, default: '' },
})

defineEmits(['update:modelValue'])

const generated = useId()
const fieldId = computed(() => props.id || generated)
const describedBy = computed(() => (props.description ? `${fieldId.value}-desc` : undefined))
</script>

<template>
  <div class="form-check iris-check mb-3">
    <input
      :id="fieldId"
      class="form-check-input"
      type="checkbox"
      :checked="modelValue"
      :aria-describedby="describedBy"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <label class="form-check-label" :for="fieldId">
      <strong>{{ label }}</strong>
      <span v-if="description" :id="describedBy" class="d-block form-text mt-0">
        {{ description }}
      </span>
    </label>
  </div>
</template>

<style scoped>
/* input is 1rem, well under the 48px target the design report promised.
   padding on the label makes the whole row the target instead */
.iris-check {
  padding: 0.6rem 0.6rem 0.6rem 2.4rem;
  border-radius: var(--iris-radius-sm);
  min-height: var(--iris-target);
}

.iris-check:hover {
  background: var(--iris-purple-50);
}

.iris-check .form-check-input {
  width: 1.3rem;
  height: 1.3rem;
  margin-left: -1.8rem;
  margin-top: 0.15rem;
}

.iris-check .form-check-input:checked {
  background-color: var(--iris-purple-900);
  border-color: var(--iris-purple-900);
}

.iris-check .form-check-label {
  cursor: pointer;
}
</style>
