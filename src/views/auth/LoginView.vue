<script setup>
import { ref, nextTick } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { required, email as isEmail, collect } from '@/lib/validators'
import BaseField from '@/components/ui/BaseField.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = ref({ email: '', password: '', remember: false })
const errors = ref({})
const summary = ref(null)

const showReset = ref(false)
const resetEmail = ref('')
const resetError = ref('')
const resetSent = ref(false)

function validate() {
  errors.value = collect({
    email: required(form.value.email, 'email') || isEmail(form.value.email),
    password: required(form.value.password, 'password'),
  })
  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validate()) {
    await nextTick()
    summary.value?.$el?.focus?.()
    return
  }
  try {
    await auth.login(form.value)
    router.push(route.query.redirect ?? '/account')
  } catch {
    // the store holds the message, nothing to do here
  }
}

async function google() {
  try {
    await auth.loginGoogle(form.value.remember)
    router.push(route.query.redirect ?? '/account')
  } catch {
    // the store holds the message, nothing to do here
  }
}

function openReset() {
  showReset.value = true
  resetEmail.value = form.value.email
  resetSent.value = false
  resetError.value = ''
}

/* always reports the same thing, whether or not the address has an account.
   telling someone "no account with that email" turns this form into a way of
   checking who is registered with an LGBTIQ+ health service. */
async function sendReset() {
  resetError.value = required(resetEmail.value, 'email') || isEmail(resetEmail.value)
  if (resetError.value) return

  try {
    await auth.resetPassword(resetEmail.value)
  } catch {
    // deliberately swallowed, see above
  }
  resetSent.value = true
}
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 520px">
    <h1 class="mb-2">Sign in</h1>
    <p class="hero-lead mb-4">
      You do not need an account to browse the directory or read resources.
      Signing in lets you keep track of bookings.
    </p>

    <ErrorSummary ref="summary" :errors="errors" />

    <p v-if="auth.error" class="alert alert-danger" role="alert">{{ auth.error }}</p>

    <form novalidate @submit.prevent="submit">
      <BaseField
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        required
        :error="errors.email"
      />

      <BaseField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        required
        :error="errors.password"
      />

      <p class="mb-3">
        <button type="button" class="btn btn-link p-0" @click="openReset">
          Forgot your password?
        </button>
      </p>

      <div class="form-check mb-4">
        <input id="remember" v-model="form.remember" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="remember">
          Keep me signed in on this device
        </label>
        <p class="form-text mt-1 mb-0">
          Leave this off on a shared or public computer. You will be signed out
          when you close the tab.
        </p>
      </div>

      <button type="submit" class="btn-iris w-100 mb-3" :disabled="auth.loading">
        {{ auth.loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <section v-if="showReset" class="reset-panel" aria-labelledby="reset-heading">
      <h2 id="reset-heading" class="h6 mb-2">Reset your password</h2>

      <div v-if="resetSent">
        <p class="mb-0">
          If an account exists for that address, a reset link is on its way.
          Check your spam folder if it does not arrive in a few minutes.
        </p>
      </div>

      <div v-else>
        <p class="small mb-3">
          We will email you a link to choose a new password.
        </p>
        <BaseField
          v-model="resetEmail"
          label="Email"
          type="email"
          autocomplete="email"
          required
          :error="resetError"
        />
        <button type="button" class="btn-iris-outline" @click="sendReset">
          Send reset link
        </button>
      </div>
    </section>

    <div class="text-center text-muted my-3">or</div>

    <button type="button" class="btn-iris-outline w-100 mb-4" @click="google">
      <i class="bi bi-google" aria-hidden="true"></i> Continue with Google
    </button>

    <p class="text-center mb-0">
      No account yet? <RouterLink to="/register">Create one</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.reset-panel {
  padding: 1.15rem;
  margin-bottom: 1rem;
  border: 1px solid var(--iris-border);
  border-radius: var(--iris-radius-md);
  background: var(--iris-surface-muted);
}
</style>
