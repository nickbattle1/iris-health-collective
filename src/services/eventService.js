import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from './firebase'

/* upcoming events and workshops. read only and world readable, same as
   resources: browsing what the charity is running should need no account. */

const toEvent = (snap) => {
  const data = snap.data()
  return {
    slug: snap.id,
    ...data,
    startAt: data.startAt ? new Date(data.startAt) : null,
    endAt: data.endAt ? new Date(data.endAt) : null,
  }
}

/* stored as UTC strings rather than timestamps so they sort lexicographically,
   which matters because melbourne shifts from +10 to +11 in october and the
   local strings either side of that would sort in the wrong order */
export async function fetchUpcomingEvents() {
  const nowIso = new Date().toISOString().replace(/\.\d{3}/, '')
  const q = query(collection(db, 'events'), where('startAt', '>=', nowIso), orderBy('startAt'))
  return (await getDocs(q)).docs.map(toEvent)
}
