<script setup>
import { ref, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { required, email as isEmail, minLength, matches, collect } from '@/lib/validators'
import BaseField from '@/components/ui/BaseField.vue'
import ErrorSummary from '@/components/ui/ErrorSummary.vue'

/* the account asks for a chosen name, an email and a password. no legal name,
   no gender field. A1 argued that collecting a detail the service never uses
   adds disclosure risk for nothing, and that argument applies here too. */

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = ref({
  displayName: '',
  email: '',
  password: '',
  confirm: '',
  remember: false,
})
const errors = ref({})
const summary = ref(null)

function validate() {
  errors.value = collect({
    displayName: required(form.value.displayName, 'chosen name'),
    email: required(form.value.email, 'email') || isEmail(form.value.email),
    password:
      required(form.value.password, 'password') ||
      minLength(form.value.password, 8, 'Password'),
    confirm: matches(form.value.password, form.value.confirm, 'Both passwords need to match'),
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
    await auth.register(form.value)
    router.push(route.query.redirect ?? '/account')
  } catch {}
}
</script>

<template>
  <div class="container py-4 py-lg-5" style="max-width: 520px">
    <h1 class="mb-2">Create an account</h1>
    <p class="hero-lead mb-4">
      We ask for as little as possible. You choose what we call you.
    </p>

    <ErrorSummary ref="summary" :errors="errors" />

    <p v-if="auth.error" class="alert alert-danger" role="alert">{{ auth.error }}</p>

    <form novalidate @submit.prevent="submit">
      <BaseField
        v-model="form.displayName"
        label="Chosen name"
        hint="What should we call you? This does not need to be your legal name."
        autocomplete="nickname"
        required
        :error="errors.displayName"
      />

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
        hint="At least 8 characters."
        autocomplete="new-password"
        required
        :error="errors.password"
      />

      <BaseField
        v-model="form.confirm"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        required
        :error="errors.confirm"
      />

      <div class="form-check mb-4">
        <input id="remember" v-model="form.remember" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="remember">Keep me signed in on this device</label>
      </div>

      <button type="submit" class="btn-iris w-100 mb-3" :disabled="auth.loading">
        {{ auth.loading ? 'Creating your account...' : 'Create account' }}
      </button>
    </form>

    <div class="border rounded p-3 mt-4">
      <p class="fw-bold mb-2">What we deliberately do not ask</p>
      <p class="mb-1 small">
        No gender field. It is not needed to hold an account, and asking raises
        disclosure risk.
      </p>
      <p class="mb-0 small">
        No legal name unless a Medicare rebate applies to a session you book.
      </p>
    </div>

    <p class="text-center mt-4 mb-0">
      Already have an account? <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </div>
</template>
