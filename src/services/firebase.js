import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'

// only file that initialises firebase. everything else pulls db, auth or
// functions from here.
//
// these keys are public by design and ship in the bundle. the rules are the
// protection, not hiding the key
//
// read https://firebase.google.com/docs/projects/api-keys to confirm it's safe

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(config)

// functions live in australia-southeast2 so appointment data stays onshore.
// the client has to name the same region or the callable resolves to
// us-central1 and 404s, which cost me an hour
export const FUNCTIONS_REGION = 'australia-southeast2'

export const db = getFirestore(app)
export const auth = getAuth(app)
export const functions = getFunctions(app, FUNCTIONS_REGION)
