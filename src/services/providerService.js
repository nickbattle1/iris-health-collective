import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'

/* the only place that knows how providers are stored. components and stores
   call these, so swapping the query or the backend touches one file. */

const toProvider = (snap) => ({ id: snap.id, ...snap.data() })

/* one read for the whole published set. filtering and sorting happen in the
   store, because 40 documents in memory beats a round trip per filter change,
   and it keeps the result count instant as chips toggle. */
export async function fetchPublishedProviders() {
  const q = query(collection(db, 'providers'), where('listingStatus', '==', 'published'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toProvider)
}

// the slug is the document id, so this is a direct read rather than a query
export async function fetchProviderBySlug(slug) {
  const snapshot = await getDoc(doc(db, 'providers', slug))
  return snapshot.exists() ? toProvider(snapshot) : null
}
