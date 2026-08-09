import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/styles/tokens.css'
import './assets/styles/main.css'

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

