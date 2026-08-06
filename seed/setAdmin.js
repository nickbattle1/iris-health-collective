import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

/* grants the admin role to one account, by email.

   run once for your own account after registering through the app:
     node seed/setAdmin.js you@example.com

   custom claims can only be set with admin credentials, which is the point.
   from day 5 an admin can promote others through the dashboard instead. */

const email = process.argv[2]
if (!email) {
  console.error('usage: node seed/setAdmin.js someone@example.com')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const key = JSON.parse(readFileSync(join(here, 'serviceAccountKey.json'), 'utf8'))

initializeApp({ credential: cert(key) })

const auth = getAuth()

try {
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { role: 'admin' })
  console.log(`${email} is now an admin`)
  console.log('sign out and back in for the new token to take effect')
  process.exit(0)
} catch (err) {
  console.error('failed:', err.message)
  process.exit(1)
}
