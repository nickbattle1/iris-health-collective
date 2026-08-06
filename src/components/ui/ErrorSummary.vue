<script setup>
/* shown after a failed submit. WCAG asks for errors to be identified in text,
   and a summary at the top means a screen reader hears the whole list instead
   of hunting field by field. each item links to the field it belongs to. */

defineProps({
  errors: { type: Object, required: true }, // { fieldId: 'message' }
})
</script>

<template>
  <div
    v-if="Object.keys(errors).length"
    class="alert alert-danger"
    role="alert"
    tabindex="-1"
  >
    <p class="fw-bold mb-2">
      There {{ Object.keys(errors).length === 1 ? 'is 1 problem' : `are ${Object.keys(errors).length} problems` }}
      with this form
    </p>
    <ul class="mb-0">
      <li v-for="(message, field) in errors" :key="field">
        <a :href="`#${field}`" class="alert-link">{{ message }}</a>
      </li>
    </ul>
  </div>
</template>
