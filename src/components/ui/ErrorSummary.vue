<script setup>
// shown after a failed submit. errors have to be identified in text for WCAG,
// and a summary up top means a screen reader gets the whole list instead of
// hunting field by field. each item links to its field.
//
// new: a message keyed "form" belongs to the submit rather than any one input,
// usually something the server threw back, so it renders as plain text. a link
// to an anchor that isn't there is worse than no link

defineProps({
  errors: { type: Object, required: true }, // { fieldId: 'message' }
  id: { type: String, default: 'error-summary' },
})

const count = (errors) => Object.keys(errors).length
</script>

<template>
  <div v-if="count(errors)" :id="id" class="alert alert-danger" role="alert" tabindex="-1">
    <p class="fw-bold mb-2">
      There {{ count(errors) === 1 ? 'is 1 problem' : `are ${count(errors)} problems` }}
      with this form
    </p>
    <ul class="mb-0">
      <li v-for="(message, field) in errors" :key="field">
        <a v-if="field !== 'form'" :href="`#${field}`" class="alert-link">{{ message }}</a>
        <span v-else>{{ message }}</span>
      </li>
    </ul>
  </div>
</template>
