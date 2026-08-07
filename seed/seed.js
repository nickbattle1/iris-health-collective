import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// imports the starting directory and the charity's own services. safe to run
// again, both collections are keyed on a stable id so a second run updates
// rather than duplicating.
//
// needs a service account key: firebase console > project settings > service
// accounts > generate new private key, saved as seed/serviceAccountKey.json.
// gitignored, keep it that way

const here = dirname(fileURLToPath(import.meta.url))
const key = JSON.parse(readFileSync(join(here, 'serviceAccountKey.json'), 'utf8'))
const providers = JSON.parse(readFileSync(join(here, 'providers.json'), 'utf8'))
const services = JSON.parse(readFileSync(join(here, 'services.json'), 'utf8'))

initializeApp({ credential: cert(key) })
const db = getFirestore()

// firestore caps a batch at 500. we're well under but chunk anyway
async function upsert(collection, rows, idField) {
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch()
    for (const row of rows.slice(i, i + 400)) {
      const { [idField]: id, ...rest } = row
      const data = idField === 'slug' ? row : rest
      batch.set(
        db.collection(collection).doc(id),
        { ...data, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
    }
    await batch.commit()
  }
  console.log(`  ${collection}: ${rows.length} documents written`)
}

async function run() {
  console.log('importing seed data...')
  await upsert('providers', providers, 'slug')
  await upsert('services', services, 'id')
  console.log('done')
  process.exit(0)
}

run().catch((err) => {
  console.error('seed failed:', err.message)
  process.exit(1)
})
