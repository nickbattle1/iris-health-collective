import { ref } from 'vue'

/* SPAs don't tell a screen reader the page changed, because the document never
   reloads. This holds a string that gets rendered into an aria-live region.
   Clearing it first, setting the same value twice announces nothing.*/

const message = ref('')

export function useAnnouncer() {
  function announce(text) {
    message.value = ''
    window.setTimeout(() => {
      message.value = text
    }, 80)
  }

  return { message, announce }
}
