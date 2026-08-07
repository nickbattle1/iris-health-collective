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

export async function createBooking(payload) {
  const call = httpsCallable(functions, 'createBooking')
  const { data } = await call(payload)
  return data
}

export async function cancelBooking(bookingId) {
  const call = httpsCallable(functions, 'cancelBooking')
  const { data } = await call({ bookingId })
  return data
}

export async function fetchMyBookings(uid) {
  const q = query(collection(db, 'bookings'), where('uid', '==', uid), orderBy('startAt', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toDoc).map(hydrateBooking)
}

// confirm screen watches its own booking so the "confirmation sent" line turns
// up on its own when the trigger finishes. no refresh
export function watchBooking(bookingId, callback) {
  return onSnapshot(doc(db, 'bookings', bookingId), (snapshot) => {
    if (snapshot.exists()) callback(hydrateBooking(toDoc(snapshot)))
  })
}
