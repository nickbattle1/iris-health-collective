import { ref, watch } from 'vue'

/* resources someone has saved to read later, kept in localStorage.

   deliberately not on their account. saving "Talking to your family about being
   trans" against a profile creates a record of what someone was reading, and
   that is exactly the disclosure risk the design report set out to remove. this
   way it never leaves the device, and Exit Site plus clearing the browser
   removes it like anything else.

   the tradeoff is that it does not follow you to another device, which is the
   correct tradeoff here. */

const KEY = 'iris.saved-resources'

const read = () => {
  try {
    const raw = window.localStorage.getItem(KEY)
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
  } catch {
    // private mode, a full quota, or someone has been editing it by hand
    return []
  }
}

// module scope, so every component that calls this shares one list
const saved = ref(read())

watch(
  saved,
  (value) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // saving is a convenience, not something worth an error message
    }
  },
  { deep: true },
)

export function useSavedResources() {
  const isSaved = (slug) => saved.value.includes(slug)

  function toggle(slug) {
    saved.value = isSaved(slug)
      ? saved.value.filter((item) => item !== slug)
      : [...saved.value, slug]
  }

  function clear() {
    saved.value = []
  }

  return { saved, isSaved, toggle, clear }
}
