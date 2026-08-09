import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as z from 'zod'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/styles/tokens.css'
import './assets/styles/main.css'

/* zod compiles a fast parser with new Function when it can, and probes for that
   by calling it inside a try. the throw is caught and it falls back fine, but
   the browser still reports a CSP violation for the attempt, which is what fills
   the console on any page with a form on it.

   jitless skips the probe. validation is identical, marginally slower on large
   objects, and script-src never needs unsafe-eval, which is the one exception
   worth not making. */
z.config({ jitless: true })

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

/* wait for firebase to report whether anyone is signed in before mounting.
   without this the first route guard runs against an unknown state and a
   signed in person gets bounced to the login screen for a moment. */
const auth = useAuthStore(pinia)
auth.init().then(() => {
  app.use(router)
  app.mount('#app')
})

