<script setup>
// radio group rather than a select. four options with a sentence each read
// better than a dropdown, and you get arrow key nav for free

defineProps({
  services: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])

const modalityLabel = {
  telehealth: 'Telehealth',
  'in-person': 'In person',
  both: 'Telehealth or in person',
}
</script>

<template>
  <fieldset class="border-0 p-0 mb-4">
    <legend class="section-heading">Choose a service</legend>

    <div
      v-for="service in services"
      :key="service.id"
      class="service-option"
      :class="{ 'is-selected': modelValue === service.id }"
    >
      <input
        :id="`service-${service.id}`"
        class="form-check-input"
        type="radio"
        name="service"
        :value="service.id"
        :checked="modelValue === service.id"
        @change="$emit('update:modelValue', service.id)"
      />
      <label class="service-option__body" :for="`service-${service.id}`">
        <span class="fw-bold d-block">{{ service.name }}</span>
        <span class="d-block text-muted small mb-1">
          {{ service.durationMinutes }} minutes with {{ service.practitionerName }}
          &middot; {{ modalityLabel[service.modality] ?? service.modality }}
          <template v-if="service.capacity > 1"> &middot; group of up to {{ service.capacity }}</template>
        </span>
        <span class="d-block small">{{ service.description }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.service-option {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}

.service-option:hover {
  background: var(--iris-purple-50);
  border-color: var(--iris-purple-500);
}

.service-option.is-selected {
  border-color: var(--iris-purple-900);
  border-width: 2px;
  background: var(--iris-purple-50);
}

.service-option .form-check-input {
  width: 1.35rem;
  height: 1.35rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.service-option .form-check-input:checked {
  background-color: var(--iris-purple-900);
  border-color: var(--iris-purple-900);
}

.service-option__body {
  cursor: pointer;
  flex: 1;
  min-height: var(--iris-target);
}
</style>
