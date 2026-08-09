import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

/* recomputes every provider's rating from its approved reviews.

   onReviewWrite already does this whenever a review changes, so this is only
   needed after something writes the provider document behind the trigger's
   back. a reseed used to do exactly that. run it once after seeding and the
   numbers agree again. */

const here = dirname(fileURLToPath(import.meta.url))
const key = JSON.parse(readFileSync(join(here, 'serviceAccountKey.json'), 'utf8'))

initializeApp({ credential: cert(key) })
const db = getFirestore()

const EXTERNALLY_ISSUED = new Set(['rainbow-tick', 'hiv-experienced'])

function basisFor(provider, count, avg) {
  const accredited = (provider.accreditations ?? []).some(
    (c) => c.status === 'verified' && EXTERNALLY_ISSUED.has(c.badgeCode),
  )
  if (accredited) return 'accredited'
  if (count >= 5 && avg >= 4) return 'community-endorsed'
  return 'charity-verified'
}

async function run() {
  const providers = await db.collection('providers').get()
  let changed = 0

  for (const doc of providers.docs) {
    const p = doc.data()
    const approved = await doc.ref.collection('reviews').where('status', '==', 'approved').get()

    const ratingSum =
      (p.baselineRatingSum ?? 0) +
      approved.docs.reduce((total, r) => total + (r.get('rating') ?? 0), 0)
    const ratingCount = (p.baselineRatingCount ?? 0) + approved.size
    const ratingAvg = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0

    if (ratingCount === p.ratingCount && ratingAvg === p.ratingAvg) continue

    await doc.ref.update({
      ratingSum,
      ratingCount,
      ratingAvg,
      inclusionBasis: basisFor(p, ratingCount, ratingAvg),
      ratingsUpdatedAt: FieldValue.serverTimestamp(),
    })
    changed += 1
    console.log(`  ${doc.id}: ${ratingAvg} from ${ratingCount}`)
  }

  console.log(`done, ${changed} of ${providers.size} updated`)
  process.exit(0)
}

run().catch((err) => {
  console.error('recalculate failed:', err.message)
  process.exit(1)
})
