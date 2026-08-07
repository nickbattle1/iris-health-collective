import { computed, nextTick, reactive, ref } from 'vue'
import { issuesToErrors } from '@/lib/schemas'

// form state wrapped round a zod schema so every form gets the same timing.
// that's the bit that drifts between screens once you have four of them.
//
// timing: error shows when you leave a field or after a failed submit, never
// while you're still typing the first character. failed submit renders the
// summary and moves focus to it

export function useZodForm(schema, initialValues) {
  const values = reactive({ ...initialValues })
  const touched = reactive({})
  const serverErrors = ref({})
  const submitted = ref(false)
  const submitting = ref(false)

  // everything the schema can see right now, shown or not
  const allErrors = computed(() => {
    const result = schema.safeParse({ ...values })
    return result.success ? {} : issuesToErrors(result.error)
  })

  const isValid = computed(() => Object.keys(allErrors.value).length === 0)

  // what actually renders under each field
  const errors = computed(() => {
    const visible = {}
    for (const [field, message] of Object.entries(allErrors.value)) {
      if (submitted.value || touched[field]) visible[field] = message
    }
    return { ...visible, ...serverErrors.value }
  })

  // summary only exists after a submit that didn't go through
  const summary = computed(() =>
    submitted.value ? { ...allErrors.value, ...serverErrors.value } : { ...serverErrors.value },
  )

  function touch(field) {
    touched[field] = true
  }

  // typing in a field the server rejected clears that message, otherwise it
  // sits there contradicting what's on screen
  function clearServerError(field) {
    if (serverErrors.value[field]) {
      const rest = { ...serverErrors.value }
      delete rest[field]
      serverErrors.value = rest
    }
  }

  function setServerErrors(fields) {
    serverErrors.value = { ...fields }
  }

  async function focusSummary() {
    await nextTick()
    document.getElementById('error-summary')?.focus()
  }

  // callback only runs on parsed data so a view never handles a half valid
  // object. anything the server sends back lands on the field it belongs to
  async function handleSubmit(onValid) {
    submitted.value = true
    serverErrors.value = {}

    const result = schema.safeParse({ ...values })
    if (!result.success) {
      await focusSummary()
      return { ok: false }
    }

    submitting.value = true
    try {
      await onValid(result.data)
      return { ok: true }
    } catch (err) {
      const fields = err?.details?.fields
      if (fields && typeof fields === 'object') setServerErrors(fields)
      else setServerErrors({ form: err?.message ?? 'Something went wrong. Please try again.' })
      await focusSummary()
      return { ok: false, error: err }
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    Object.assign(values, initialValues)
    for (const key of Object.keys(touched)) delete touched[key]
    serverErrors.value = {}
    submitted.value = false
  }

  return {
    values,
    errors,
    summary,
    isValid,
    submitted,
    submitting,
    touch,
    clearServerError,
    setServerErrors,
    handleSubmit,
    reset,
  }
}
