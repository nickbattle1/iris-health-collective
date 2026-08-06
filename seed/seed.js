import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

/* one off import of the starting directory. safe to run repeatedly: providers
   are keyed on slug, so a second run updates rather than duplicates.

   needs a service account key. firebase console > project settings >
   service accounts > generate new private key, saved as
   seed/serviceAccountKey.json. that file is gitignored and must stay that way. */

const here = dirname(fileURLToPath(import.meta.url))
const key = JSON.parse(readFileSync(join(here, 'serviceAccountKey.json'), 'utf8'))
const providers = JSON.parse(readFileSync(join(here, 'providers.json'), 'utf8'))

initializeApp({ credential: cert(key) })
const db = getFirestore()

async function run() {
  console.log(`importing ${providers.length} providers...`)

  // firestore caps a batch at 500 writes, we are well under but chunk anyway
  const chunks = []
  for (let i = 0; i < providers.length; i += 400) {
    chunks.push(providers.slice(i, i + 400))
  }

  let written = 0
  for (const chunk of chunks) {
    const batch = db.batch()
    for (const p of chunk) {
      const ref = db.collection('providers').doc(p.slug)
      batch.set(
        ref,
        { ...p, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      written++
    }
    await batch.commit()
  }

  console.log(`done, ${written} documents written`)
  process.exit(0)
}

run().catch((err) => {
  console.error('seed failed:', err.message)
  process.exit(1)
})
