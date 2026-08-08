// shared with functions/lib, copied there at deploy by the hook in
// firebase.json. edit here, not there.

import { fromZoned, isoDate, isoWeekday, slotKey, zoneParts } from './timezone.js'

// slots come off the service doc, not constants in here, so the charity can
// change its hours without a deploy.
//
// client draws the calendar from slotsForDay. server runs isLegalSlot against
// whatever time it was handed, which is the half that actually matters.

export const DEFAULT_AVAILABILITY = {
  days: [1, 2, 3, 4, 5], // mon to fri
  startHour: 9,
  endHour: 17,
  slotMinutes: 60, // grid spacing, can be wider than the session itself
  leadHours: 2, // nothing bookable inside the next 2 hours
  horizonDays: 21,
}

export const availabilityOf = (service) => ({
  ...DEFAULT_AVAILABILITY,
  ...service?.availability,
})

const DAY_MS = 24 * 60 * 60 * 1000

// next few days this service actually runs. cursor sits at midday so adding
// 24h across a DST change still lands on the next calendar day
export function bookableDays(service, count = 10, now = new Date()) {
  const rules = availabilityOf(service)
  const today = zoneParts(now)
  let cursor = fromZoned(today.year, today.month, today.day, 12)

  const days = []
  for (let step = 0; step <= rules.horizonDays && days.length < count; step += 1) {
    const p = zoneParts(cursor)
    if (rules.days.includes(isoWeekday(p.year, p.month, p.day))) {
      days.push(isoDate(cursor))
    }
    cursor = new Date(cursor.getTime() + DAY_MS)
  }
  return days
}

// every slot on a day, each one carrying why it can't be taken. the reason is
// returned rather than styled in, the calendar has to say "fully booked" out
// loud for a screen reader
export function slotsForDay(service, day, { now = new Date(), taken = {} } = {}) {
  const rules = availabilityOf(service)
  const duration = service?.durationMinutes ?? 50
  const capacity = service?.capacity ?? 1
  const [year, month, date] = day.split('-').map(Number)
  const earliest = now.getTime() + rules.leadHours * 60 * 60 * 1000
  const latest = now.getTime() + rules.horizonDays * DAY_MS

  const slots = []
  for (
    let minutes = rules.startHour * 60;
    minutes + duration <= rules.endHour * 60;
    minutes += rules.slotMinutes
  ) {
    const start = fromZoned(year, month, date, Math.floor(minutes / 60), minutes % 60)
    const end = new Date(start.getTime() + duration * 60 * 1000)
    const key = slotKey(start)
    const booked = taken[key] ?? 0
    const remaining = Math.max(capacity - booked, 0)

    let reason = null
    if (start.getTime() < earliest) reason = 'too-soon'
    else if (start.getTime() > latest) reason = 'too-far'
    else if (remaining === 0) reason = 'full'

    slots.push({ key, start, end, remaining, capacity, available: reason === null, reason })
  }
  return slots
}

// a start time is only legal if the calendar could have drawn it. stops a
// hand rolled request booking 3am on a sunday. conflict check is separate and
// runs after this
export function isLegalSlot(service, start, now = new Date()) {
  const rules = availabilityOf(service)
  const duration = service?.durationMinutes ?? 50
  const p = zoneParts(start)
  const minutes = p.hour * 60 + p.minute

  if (!rules.days.includes(p.weekday)) return false
  if (minutes < rules.startHour * 60) return false
  if (minutes + duration > rules.endHour * 60) return false
  if ((minutes - rules.startHour * 60) % rules.slotMinutes !== 0) return false
  if (start.getTime() < now.getTime() + rules.leadHours * 60 * 60 * 1000) return false
  if (start.getTime() > now.getTime() + rules.horizonDays * DAY_MS) return false

  return true
}

export const endOfSlot = (service, start) =>
  new Date(start.getTime() + (service?.durationMinutes ?? 50) * 60 * 1000)

// two intervals clash when each starts before the other finishes
export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd
