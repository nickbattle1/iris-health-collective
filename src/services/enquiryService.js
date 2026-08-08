import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

// the contact form's one call. writes go through submitEnquiry rather than
// firestore, same as bookings: rules deny client writes to enquiries so that
// nobody can flood the collection or read back what someone else reported.

const TRANSPORT_ERRORS = {
  internal: 'We could not send your message. Check your connection and try again.',
  unavailable: 'The service is busy. Please try again in a moment.',
  'deadline-exceeded': 'That took too long. Please try again.',
  'permission-denied': 'We could not send that. Please reload the page and try again.',
}

export async function submitEnquiry(payload) {
  try {
    const { data } = await httpsCallable(functions, 'submitEnquiry')(payload)
    return data
  } catch (err) {
    // the function writes its own message for anything it rejects on purpose.
    // these are the codes firebase generates itself, where the message is one
    // word and means nothing to the person reading it
    const friendly = TRANSPORT_ERRORS[err?.code?.replace('functions/', '')]
    if (!friendly) throw err

    const wrapped = new Error(friendly)
    wrapped.code = err.code
    wrapped.details = err.details
    throw wrapped
  }
}
