import { collection, collectionGroup, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

/* reviews. writes go through callables, same as bookings and enquiries, so a
   practice cannot write its own rating and nobody can approve their own. */

const TRANSPORT_ERRORS = {
  internal: 'We could not save that. Check your connection and try again.',
  unavailable: 'The service is busy. Please try again in a moment.',
  'deadline-exceeded': 'That took too long. Please try again.',
  unauthenticated: 'Your session has expired. Reload the page and try again.',
}

async function call(name, payload) {
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

export const submitReview = (payload) => call('submitReview', payload)
export const moderateReview = (payload) => call('moderateReview', payload)

const toReview = (snap) => ({
  id: snap.id,
  ...snap.data(),
  createdAt: snap.data().createdAt?.toDate?.() ?? null,
})

// approved only. rules enforce it too, this just avoids asking for what will
// be refused
export async function fetchApprovedReviews(providerId) {
  const q = query(
    collection(db, 'providers', providerId, 'reviews'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
  )
  return (await getDocs(q)).docs.map(toReview)
}

/* your own review, whatever its status. the rules let you read the document
   named after your uid, so this is one direct read rather than a query */
export async function fetchMyReview(providerId, uid) {
  const snap = await getDoc(doc(db, 'providers', providerId, 'reviews', uid))
  return snap.exists() ? toReview(snap) : null
}

/* the moderation queue reads across every provider at once, so this is a
   collection group query rather than 40 subcollection reads. needs the index
   in firestore.indexes.json and the /{path=**}/reviews rule.

   the document id is the reviewer's uid, which is unique inside one practice
   and not across them: one person reviewing three practices gives three rows
   sharing an id. so the row is keyed by its full path, and the uid travels
   separately as reviewId for the callable that needs it. */
export async function fetchReviewsByStatus(status) {
  const q = query(collectionGroup(db, 'reviews'), where('status', '==', status), orderBy('createdAt', 'desc'))
  return (await getDocs(q)).docs.map((snap) => ({
    ...toReview(snap),
    id: snap.ref.path,
    reviewId: snap.id,
  }))
}
