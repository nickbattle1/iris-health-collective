import { setGlobalOptions } from 'firebase-functions/v2'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import * as logger from 'firebase-functions/logger'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

import {
  bookingRequestSchema,
  cancelRequestSchema,
  firstMessage,
  issuesToErrors,
  roleRequestSchema,
} from './lib/schemas.js'
import { isLegalSlot } from './lib/slots.js'
import { createBookingTransaction, cancelBookingTransaction } from './lib/booking.js'
import { buildConfirmationPdf } from './lib/pdf.js'
import { sendConfirmation } from './lib/email.js'

// functions v2. everything exports from here.
//
// maxInstances is the only thing that caps the damage if a trigger misbehaves.
// a budget alert emails you, it doesn't stop anything, so this line is the
// actual control.
//
// region matches the firestore location so appointment data stays onshore and
// the round trip isn't a detour via Iowa. client names the same region in
// services/firebase.js
setGlobalOptions({ region: 'australia-southeast2', maxInstances: 3 })

initializeApp()
const db = getFirestore()

// key never leaves the runtime. functions:secrets:set puts it in Secret
// Manager and mounts it at run time, so it's not in the repo, not in the
// bundle, not in a .env on my laptop
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
const RESEND_FROM = defineString('RESEND_FROM', { default: 'onboarding@resend.dev' })
const RESEND_TO_OVERRIDE = defineString('RESEND_TO_OVERRIDE', { default: '' })

// createBooking, callable. server side validation for B.1, conflict
// management for F.1. the important one.
export const createBooking = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Please start a session before booking.')
  }

  // same schema the form used, parsed again. the client copy is so you hear
  // about a typo before pressing a button. this copy is the one that decides,
  // anything the browser sends can be edited on the way
  const parsed = bookingRequestSchema.safeParse(request.data)
  if (!parsed.success) {
    // field map rides back in details so the form can put each message against
    // its own input instead of one banner at the top
    throw new HttpsError('invalid-argument', firstMessage(parsed.error), {
      fields: issuesToErrors(parsed.error),
    })
  }

  const { serviceId, startAt, details } = parsed.data
  const serviceSnap = await db.collection('services').doc(serviceId).get()

  if (!serviceSnap.exists || serviceSnap.get('active') !== true) {
    throw new HttpsError('not-found', 'That session is no longer open for booking.')
  }

  const service = { id: serviceSnap.id, ...serviceSnap.data() }
  const start = new Date(startAt)

  // has to be a time the calendar could have drawn. without this you can hand
  // roll a request and book 3am on a sunday
  if (!isLegalSlot(service, start)) {
    throw new HttpsError(
      'failed-precondition',
      'That time is not one we can offer. Please choose another.',
      { fields: { form: 'That time is no longer available. Please choose another.' } },
    )
  }

  const result = await createBookingTransaction(db, { uid, serviceId, service, start, details })

  if (result.conflict === 'slot') {
    throw new HttpsError(
      'already-exists',
      'Someone booked that time while you were filling in the form. Please choose another.',
      { fields: { form: 'That time has just been taken. Please choose another.' } },
    )
  }

  if (result.conflict === 'own') {
    throw new HttpsError('already-exists', 'You already have a session booked at that time.', {
      fields: { form: 'You already have a session booked at that time.' },
    })
  }

  logger.info('booking created', { bookingId: result.id, serviceId })

  // only what the confirm screen renders, and all of it is the caller's own
  return {
    id: result.id,
    reference: result.reference,
    slotKey: result.slotKey,
    status: 'confirmed',
    serviceId,
    serviceName: service.name,
    practitionerName: service.practitionerName,
    location: result.booking.location,
    durationMinutes: service.durationMinutes,
    startAt: result.start.toISOString(),
    endAt: result.end.toISOString(),
    chosenName: result.booking.chosenName,
    pronouns: result.booking.pronouns,
    discreetReminder: result.booking.discreetReminder,
    emailStatus: result.booking.emailStatus,
  }
})

// cancelBooking, callable
export const cancelBooking = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Please sign in to change a booking.')

  const parsed = cancelRequestSchema.safeParse(request.data)
  if (!parsed.success) throw new HttpsError('invalid-argument', firstMessage(parsed.error))

  const result = await cancelBookingTransaction(db, {
    bookingId: parsed.data.bookingId,
    uid,
    isAdmin: request.auth?.token?.role === 'admin',
  })

  if (result.error === 'not-found') throw new HttpsError('not-found', 'We could not find that booking.')
  if (result.error === 'not-yours') {
    // same answer for a booking that isn't yours as one that doesn't exist,
    // otherwise you could poke at ids to find out whose it is
    throw new HttpsError('not-found', 'We could not find that booking.')
  }
  if (result.error === 'already-started') {
    throw new HttpsError('failed-precondition', 'That session has already started.')
  }

  logger.info('booking cancelled', { bookingId: parsed.data.bookingId })
  return { ok: true }
})

// onBookingCreated, firestore trigger. D.2 email with the attachment, and the
// server side half of E.4
export const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) return

    const booking = { id: snapshot.id, ...snapshot.data() }

    // no address stored means nobody asked for one, which is the default
    if (!booking.email) return

    // yes this writes back to the collection it listens on. safe here and
    // only here, onDocumentCreated doesn't fire on update so it can't
    // retrigger. onWrite would loop and maxInstances would cap the bill, not
    // the loop
    try {
      const pdf = await buildConfirmationPdf(booking)
      const sent = await sendConfirmation({
        apiKey: RESEND_API_KEY.value(),
        from: RESEND_FROM.value(),
        overrideTo: RESEND_TO_OVERRIDE.value(),
        booking,
        pdfBase64: Buffer.from(pdf).toString('base64'),
      })

      await snapshot.ref.update({
        emailStatus: 'sent',
        emailedAt: FieldValue.serverTimestamp(),
        emailId: sent?.id ?? null,
      })

      logger.info('confirmation sent', { bookingId: booking.id, emailId: sent?.id })
    } catch (err) {
      // a failed email doesn't invalidate a confirmed booking. record it and
      // leave the appointment alone
      logger.error('confirmation failed', { bookingId: booking.id, message: err.message })
      await snapshot.ref.update({
        emailStatus: 'failed',
        emailError: String(err.message).slice(0, 200),
      })
    }
  },
)

// setUserRole, callable, admin only. C.2
export const setUserRole = onCall(async (request) => {
  // caller's own claim checked first, off the verified token and not anything
  // in the body. a client that could name its own role would make the whole
  // thing decorative
  if (request.auth?.token?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only charity staff can change roles.')
  }

  const parsed = roleRequestSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', firstMessage(parsed.error), {
      fields: issuesToErrors(parsed.error),
    })
  }

  const { email, role } = parsed.data
  const auth = getAuth()

  let user
  try {
    user = await auth.getUserByEmail(email)
  } catch {
    throw new HttpsError('not-found', 'No account exists with that email address.')
  }

  // member is the absence of a claim rather than a value, so demoting clears
  // it and the token carries nothing to misread
  await auth.setCustomUserClaims(user.uid, role === 'member' ? {} : { role })

  // display only mirror. rules never read this, a role in a document is a role
  // the owner of that document might be able to edit
  await db.doc(`users/${user.uid}`).set({ role }, { merge: true })

  logger.info('role changed', { uid: user.uid, role })
  return { ok: true, uid: user.uid, role }
})
