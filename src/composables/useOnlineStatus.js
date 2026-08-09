import { onBeforeUnmount, onMounted, ref } from 'vue'

/* whether the browser thinks it has a connection.

   navigator.onLine is not a promise that anything is reachable, only that a
   network interface exists. it is right often enough to tell someone why a
   booking will not go through, and wrong in the harmless direction: it says
   online on captive wifi, which then fails with a real error message. */

export function useOnlineStatus() {
  const online = ref(navigator.onLine)

  const goOnline = () => (online.value = true)
  const goOffline = () => (online.value = false)

  onMounted(() => {
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', goOnline)
    window.removeEventListener('offline', goOffline)
  })

  return { online }
}
