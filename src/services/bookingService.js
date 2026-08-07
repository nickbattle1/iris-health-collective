import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

// everything the booking flow needs from the backend.
//
// both writes go through callable functions instead of firestore. rules deny
// every client write to bookings on purpose: preventing a double booking means
// reading and writing atomically and the browser can't be trusted with either

const toDoc = (snap) => ({ id: snap.id, ...snap.data() })

/* the function writes its own message for anything it rejects on purpose, so
   those pass straight through. these are the codes firebase generates itself,
   where the message is a single word like "internal" and means nothing to the
   person reading it. */
const TRANSPORT_ERRORS = {
  internal: 'We could not reach the booking service. Check your connection and try again.',
  unavailable: 'The booking service is busy. Please try again in a moment.',
  'deadline-exceeded': 'That took too long. Please try again.',
  unauthenticated: 'Your session has expired. Reload the page and try again.',
  'permission-denied': 'We could not complete that. Please reload the page and try again.',
}

async function callFunction(name, payload) {
  try {
    const { data } = await httpsCallable(functions, name)(payload)
    return data
  } catch (err) {
    const friendly = TRANSPORT_ERRORS[err?.code?.replace('functions/', '')]
    if (!friendly) throw err
    const wrapped = new Error(friendly)
    wrapped.code = err.code
    wrapped.details = err.details
    throw wrapped
  }
}

// Timestamp out, Date in
const toDate = (value) => (value?.toDate ? value.toDate() : value ? new Date(value) : null)

export function hydrateBooking(raw) {
  return {
    ...raw,
    startAt: toDate(raw.startAt),
    endAt: toDate(raw.endAt),
    createdAt: toDate(raw.createdAt),
  }
}

export async function fetchServices() {
  const q = query(collection(db, 'services'), where('active', '==', true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toDoc).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

// counts only, no names or uids. that's why this doc is world readable and
// bookings aren't
export async function fetchAvailability(serviceId) {
  const snapshot = await getDoc(doc(db, 'availability', serviceId))
  return snapshot.exists() ? (snapshot.data().slots ?? {}) : {}
}

export const createBooking = (payload) => callFunction('createBooking', payload)

export const cancelBooking = (bookingId) => callFunction('cancelBooking', { bookingId })

export const claimBooking = (payload) => callFunction('claimBooking', payload)

export async function fetchMyBookings(uid) {
  const q = query(collection(db, 'bookings'), where('uid', '==', uid), orderBy('startAt', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toDoc).map(hydrateBooking)
}

// confirm screen watches its own booking so the "confirmation sent" line turns
// up on its own when the trigger finishes. no refresh
export function watchBooking(bookingId, callback) {
  return onSnapshot(
    doc(db, 'bookings', bookingId),
    (snapshot) => {
      if (snapshot.exists()) callback(hydrateBooking(toDoc(snapshot)))
    },
    /* a listener has to be handed an error callback or firestore throws it
       uncaught into the console. this one loses read access the moment the
       booking changes owner, which is exactly what a claim does, so drop it
       quietly rather than shouting about it */
    (err) => {
      console.warn('[booking] stopped watching', err.code)
    },
  )
}
