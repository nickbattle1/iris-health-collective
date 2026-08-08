import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

/* what the staff dashboard reads. every one of these is refused by the rules
   unless the caller's token carries role admin, so the guard on the route is
   convenience and this is the actual boundary. */

const toDate = (value) => value?.toDate?.() ?? null

export async function fetchAllBookings(max = 300) {
  const q = query(collection(db, 'bookings'), orderBy('startAt', 'desc'), limit(max))
  return (await getDocs(q)).docs.map((snap) => ({
    id: snap.id,
    ...snap.data(),
    startAt: toDate(snap.data().startAt),
    createdAt: toDate(snap.data().createdAt),
  }))
}

export async function fetchEnquiries(max = 200) {
  const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'), limit(max))
  return (await getDocs(q)).docs.map((snap) => ({
    id: snap.id,
    ...snap.data(),
    createdAt: toDate(snap.data().createdAt),
  }))
}

export async function setUserRole(payload) {
  const { data } = await httpsCallable(functions, 'setUserRole')(payload)
  return data
}
