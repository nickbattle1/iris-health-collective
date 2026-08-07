import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { endOfSlot, overlaps } from './slots.js'
import { slotKey } from './timezone.js'
import { minimiseDetails } from './schemas.js'

// the conflict transaction. the one bit of this app that can't live on the
// client at any price.
//
// two people can have the same slot on screen at once. check it's free, then
// write the booking, and the gap between those two operations is where the
// double booking happens. a transaction reads and writes atomically: if
// anything it read changed by commit time the whole thing retries against
// fresh data. second person gets told.

// nothing runs longer than 4 hours, so anything starting before this window
// can't still be going when the requested slot begins
const CLASH_WINDOW_MS = 4 * 60 * 60 * 1000

const reference = (id) => `IRIS-${id.slice(0, 6).toUpperCase()}`

function clashQuery(db, field, value, start, end) {
  return db
    .collection('bookings')
    .where(field, '==', value)
    .where('status', '==', 'confirmed')
    .where('startAt', '>=', Timestamp.fromDate(new Date(start.getTime() - CLASH_WINDOW_MS)))
    .where('startAt', '<', Timestamp.fromDate(end))
}

const overlapping = (docs, start, end) =>
  docs.filter((doc) => overlaps(start, end, doc.get('startAt').toDate(), doc.get('endAt').toDate()))

export async function createBookingTransaction(db, { uid, serviceId, service, start, details }) {
  const end = endOfSlot(service, start)
  const capacity = service.capacity ?? 1
  const key = slotKey(start)
  const bookingRef = db.collection('bookings').doc()
  const availabilityRef = db.collection('availability').doc(serviceId)

  return db.runTransaction(async (tx) => {
    // all the reads first, firestore insists
    const sameSlot = await tx.get(clashQuery(db, 'serviceId', serviceId, start, end))
    const taken = overlapping(sameSlot.docs, start, end).length

    if (taken >= capacity) return { conflict: 'slot' }

    // a group has room for 8 people but not the same person twice, and nobody
    // is in two places at once either. one query across all services catches
    // both
    const mine = await tx.get(clashQuery(db, 'uid', uid, start, end))
    if (overlapping(mine.docs, start, end).length > 0) return { conflict: 'own' }

    const booking = {
      serviceId,
      serviceName: service.name,
      practitionerName: service.practitionerName,
      modality: service.modality,
      location: service.location ?? 'We will confirm the location with you',
      durationMinutes: service.durationMinutes,
      startAt: Timestamp.fromDate(start),
      endAt: Timestamp.fromDate(end),
      status: 'confirmed',
      reference: reference(bookingRef.id),
      uid,
      // drops the contact fields nobody asked to give
      ...minimiseDetails(details),
      emailStatus: details.wantsEmail ? 'queued' : 'not-requested',
      createdAt: FieldValue.serverTimestamp(),
    }

    tx.set(bookingRef, booking)

    // the count the calendar reads, written in the same transaction as the
    // booking so the two can't disagree. no names, no uids, which is why this
    // one can be world readable and bookings can't
    tx.set(
      availabilityRef,
      { slots: { [key]: taken + 1 }, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )

    return { id: bookingRef.id, reference: booking.reference, slotKey: key, booking, start, end }
  })
}

export async function cancelBookingTransaction(db, { bookingId, uid, isAdmin }) {
  const bookingRef = db.collection('bookings').doc(bookingId)

  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(bookingRef)
    if (!snapshot.exists) return { error: 'not-found' }

    const booking = snapshot.data()
    if (booking.uid !== uid && !isAdmin) return { error: 'not-yours' }
    if (booking.status === 'cancelled') return { alreadyCancelled: true }

    const start = booking.startAt.toDate()
    if (start.getTime() < Date.now()) return { error: 'already-started' }

    const availabilityRef = db.collection('availability').doc(booking.serviceId)
    const availability = await tx.get(availabilityRef)
    const key = slotKey(start)
    const current = availability.exists ? (availability.get('slots')?.[key] ?? 0) : 0

    tx.update(bookingRef, {
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: uid,
    })

    // never below zero. a missing count is a display problem, a negative one
    // hands out a slot that doesn't exist
    tx.set(
      availabilityRef,
      { slots: { [key]: Math.max(current - 1, 0) }, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )

    return { cancelled: true }
  })
}
