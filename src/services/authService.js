import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  deleteUser,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

/* everything that touches firebase auth. the store calls these, components
   call the store, so swapping provider means editing one file. */

/* session persistence defaults to this tab only. A1's Darius browses on a
   shared family laptop, so staying signed in has to be a deliberate choice
   rather than the default. */
async function applyPersistence(remember) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

/* the role lives in a custom claim, set server side. a role stored in a
   firestore document would be readable and potentially writable by the client,
   so rules never look at one. no claim means member. */
export async function readRole(user) {
  if (!user || user.isAnonymous) return 'member'
  const token = await user.getIdTokenResult()
  return token.claims.role ?? 'member'
}

export async function registerWithEmail({ email, password, displayName, remember }) {
  await applyPersistence(remember)
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName })
  await saveProfile(user.uid, { displayName, pronouns: '', reminderPrefs: 'discreet' })
  return user
}

export async function loginWithEmail({ email, password, remember }) {
  await applyPersistence(remember)
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function loginWithGoogle(remember) {
  await applyPersistence(remember)
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const { user } = await signInWithPopup(auth, provider)

  const existing = await getProfile(user.uid)
  if (!existing) {
    await saveProfile(user.uid, {
      displayName: user.displayName ?? 'Friend',
      pronouns: '',
      reminderPrefs: 'discreet',
    })
  }
  return user
}

/* an anonymous session is only started when someone takes an action that needs
   one, never on page load. browsing stays completely unidentified. */
export async function startAnonymousSession() {
  await applyPersistence(false)
  const { user } = await signInAnonymously(auth)
  return user
}

// turns an anonymous session into a permanent account, keeping the same uid
export async function upgradeAnonymous({ email, password, displayName }) {
  const credential = EmailAuthProvider.credential(email, password)
  const { user } = await linkWithCredential(auth.currentUser, credential)
  await updateProfile(user, { displayName })
  await saveProfile(user.uid, { displayName, pronouns: '', reminderPrefs: 'discreet' })
  return user
}

export const logout = () => signOut(auth)

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function saveProfile(uid, data) {
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

/* a real delete, not a flag. the profile document goes, then the auth user.
   firebase requires a recent sign in for this, so the caller handles the
   requires-recent-login error by asking the person to sign in again. */
export async function deleteAccount() {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  await deleteDoc(doc(db, 'users', user.uid))
  await deleteUser(user)
}
