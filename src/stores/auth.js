import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const role = ref('member')
  const loading = ref(false)
  const error = ref(null)

  // resolves once firebase has told us whether someone is signed in. router
  // guards await this, otherwise the first navigation runs before we know.
  let resolveReady
  const ready = new Promise((resolve) => {
    resolveReady = resolve
  })

  const isAuthenticated = computed(() => !!user.value && !user.value.isAnonymous)
  const isAnonymous = computed(() => !!user.value?.isAnonymous)
  const isAdmin = computed(() => role.value === 'admin')
  const isProvider = computed(() => role.value === 'provider')
  const displayName = computed(
    () => profile.value?.displayName ?? user.value?.displayName ?? 'Friend',
  )

  function init() {
    authService.watchAuth(async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        role.value = await authService.readRole(firebaseUser)
        profile.value = firebaseUser.isAnonymous
          ? null
          : await authService.getProfile(firebaseUser.uid)
      } else {
        role.value = 'member'
        profile.value = null
      }
      resolveReady()
    })
    return ready
  }

  // every action funnels through here so error handling stays in one place
  async function run(fn) {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err) {
      error.value = friendlyMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = (details) => run(() => authService.registerWithEmail(details))
  const login = (details) => run(() => authService.loginWithEmail(details))
  const loginGoogle = (remember) => run(() => authService.loginWithGoogle(remember))
  const continueAnonymously = () => run(() => authService.startAnonymousSession())
  const logout = () => run(() => authService.logout())
  const deleteAccount = () => run(() => authService.deleteAccount())

  async function updateProfileFields(fields) {
    await run(async () => {
      await authService.saveProfile(user.value.uid, fields)
      profile.value = { ...profile.value, ...fields }
    })
  }

  return {
    user, profile, role, loading, error, ready,
    isAuthenticated, isAnonymous, isAdmin, isProvider, displayName,
    init, register, login, loginGoogle, continueAnonymously, logout,
    deleteAccount, updateProfileFields,
  }
})

/* firebase error codes are not something to put in front of a person in
   distress. map the ones we expect, fall back to something calm. */
function friendlyMessage(err) {
  const map = {
    'auth/invalid-credential': 'That email or password is not right. Please try again.',
    'auth/invalid-email': 'That does not look like an email address.',
    'auth/email-already-in-use': 'An account already exists with that email. Try signing in.',
    'auth/weak-password': 'Please choose a password of at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/popup-closed-by-user': 'The Google sign in window was closed before finishing.',
    'auth/requires-recent-login': 'For security, please sign in again before deleting your account.',
    'auth/network-request-failed': 'We could not reach the server. Check your connection.',
  }
  return map[err?.code] ?? 'Something went wrong. Please try again.'
}
