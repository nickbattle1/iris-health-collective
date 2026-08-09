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
  const isVerified = computed(() => !!user.value?.emailVerified)
  const displayName = computed(
    () => profile.value?.displayName ?? user.value?.displayName ?? 'Friend',
  )

  /* applies whatever the SDK just handed back instead of waiting on the
     listener.

     two separate timing problems made this necessary. linkWithCredential never
     fires onAuthStateChanged at all, so upgrading an anonymous session left
     isAuthenticated false and the guard bounced you to login. and signing in
     fires it a tick after the promise resolves, so the router.push straight
     after ran against a stale user and looked like nothing happened until you
     refreshed. */
  async function applyUser(firebaseUser) {
    user.value = firebaseUser ?? null

    if (!firebaseUser) {
      role.value = 'member'
      profile.value = null
      return
    }

    /* the profile read is a firestore read and every route guard waits on this
       function finishing. offline it throws, and without this catch the promise
       below never settles, so every navigation hangs forever including the one
       to the crisis page. the session is still valid, we just cannot enrich it. */
    try {
      role.value = await authService.readRole(firebaseUser)
      profile.value = firebaseUser.isAnonymous
        ? null
        : await authService.getProfile(firebaseUser.uid)
    } catch (err) {
      console.error('[auth] could not load the profile', err)
    }
  }

  function init() {
    authService.watchAuth(async (firebaseUser) => {
      // finally, not after. resolving the guard has to happen whatever the
      // read above did
      try {
        await applyUser(firebaseUser)
      } finally {
        resolveReady()
      }
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
      console.error('[auth]', err.code ?? '', err.message ?? err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /* creating an account while anonymous links the credential to the session
     you already have, so the uid never changes and anything booked under it
     stays yours. registering fresh would mint a new uid and orphan the
     booking, which is what it used to do */
  const register = (details) =>
    run(async () =>
      applyUser(
        isAnonymous.value
          ? await authService.upgradeAnonymous(details)
          : await authService.registerWithEmail(details),
      ),
    )
  const login = (details) => run(async () => applyUser(await authService.loginWithEmail(details)))
  const loginGoogle = (remember) =>
    run(async () => applyUser(await authService.loginWithGoogle(remember)))
  const continueAnonymously = () =>
    run(async () => applyUser(await authService.startAnonymousSession()))
  const logout = () =>
    run(async () => {
      await authService.logout()
      await applyUser(null)
    })

  // proof that this browser held the session that made a booking. has to be
  // taken before signing in, because signing in replaces the session
  const getIdToken = () => user.value?.getIdToken?.() ?? Promise.resolve(null)
  const deleteAccount = () => run(() => authService.deleteAccount())
  const resendVerification = () => run(() => authService.sendVerification())
  const resetPassword = (email) => run(() => authService.resetPassword(email))

  // errors are store state, so they outlive the screen that caused them.
  // the router clears this on every navigation.
  const clearError = () => {
    error.value = null
  }

  async function updateProfileFields(fields) {
    return run(async () => {
      await authService.saveProfile(user.value.uid, fields)
      // re-read rather than trusting local state, so a rejected write shows up
      profile.value = await authService.getProfile(user.value.uid)
    })
  }

  return {
    user, profile, role, loading, error, ready,
    isAuthenticated, isAnonymous, isAdmin, isProvider, isVerified, displayName,
    init, register, login, loginGoogle, continueAnonymously, logout, getIdToken,
    deleteAccount, updateProfileFields, resendVerification, resetPassword, clearError,
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
    'permission-denied': 'We could not save that. Please sign out and back in, then try again.',
  }
  return map[err?.code] ?? 'Something went wrong. Please try again.'
}

