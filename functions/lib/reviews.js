import { FieldValue } from 'firebase-admin/firestore'

/* review aggregation. the same argument as inclusionBasis: a rating that the
   practice being rated could write is not a rating.

   nothing here trusts the incoming document. the average is recomputed from
   every approved review each time one changes, rather than adjusted by a
   delta, because a delta drifts the moment one write is missed or replayed. */

// badges somebody other than the charity issues, which is what lets a listing
// count as accredited rather than reviewed by us
const EXTERNALLY_ISSUED = new Set(['rainbow-tick', 'hiv-experienced'])

const isLive = (claim) => claim?.status === 'verified'

export function inclusionBasisFor(provider, ratingCount, ratingAvg) {
  const accredited = (provider.accreditations ?? []).some(
    (claim) => isLive(claim) && EXTERNALLY_ISSUED.has(claim.badgeCode),
  )
  if (accredited) return 'accredited'

  // five approved reviews at four stars or better. one glowing review from a
  // friend of the practice should not move a listing
  if (ratingCount >= 5 && ratingAvg >= 4) return 'community-endorsed'

  return 'charity-verified'
}

export async function recalculateProvider(db, providerId) {
  const providerRef = db.collection('providers').doc(providerId)

  const approved = await providerRef
    .collection('reviews')
    .where('status', '==', 'approved')
    .get()

  const providerSnap = await providerRef.get()
  if (!providerSnap.exists) return null

  const provider = providerSnap.data()

  /* the seed carries a baseline: reviews the charity already held when the
     directory moved onto this site. without it the first real review would
     replace nine years of feedback with a sample of one, which is what it did
     until someone left a review and watched the count drop from 9 to 1. */
  const baseCount = provider.baselineRatingCount ?? 0
  const baseSum = provider.baselineRatingSum ?? 0

  const ratingSum =
    baseSum + approved.docs.reduce((total, doc) => total + (doc.get('rating') ?? 0), 0)
  const ratingCount = baseCount + approved.size

  // one decimal, so 4.25 does not render as 4.25 in a five star widget
  const ratingAvg = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0

  const basis = inclusionBasisFor(provider, ratingCount, ratingAvg)

  await providerRef.update({
    ratingSum,
    ratingCount,
    ratingAvg,
    inclusionBasis: basis,
    ratingsUpdatedAt: FieldValue.serverTimestamp(),
  })

  return { ratingCount, ratingAvg, inclusionBasis: basis }
}
