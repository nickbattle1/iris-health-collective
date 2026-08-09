import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'

/* published guides. world readable, no account, no session, which is the whole
   point of this section: reading about gender affirming care should leave
   nothing behind. */

const toResource = (snap) => ({ slug: snap.id, ...snap.data() })

export async function fetchResources() {
  const snapshot = await getDocs(collection(db, 'resources'))
  return snapshot.docs
    .map(toResource)
    .sort((a, b) => (b.featured ?? 0) - (a.featured ?? 0) || a.title.localeCompare(b.title))
}

export async function fetchResourceBySlug(slug) {
  const snap = await getDoc(doc(db, 'resources', slug))
  return snap.exists() ? toResource(snap) : null
}

// the three cards on the home page. same documents, so editing a guide changes
// both places instead of one of them going stale
export async function fetchFeaturedResources() {
  const q = query(collection(db, 'resources'), where('featured', '>', 0))
  return (await getDocs(q)).docs
    .map(toResource)
    .sort((a, b) => a.featured - b.featured)
    .slice(0, 3)
}
