// shared with functions/lib, copied there at deploy by the hook in
// firebase.json. edit here, not there.

// appointments are melbourne wall clock times. a Date is an instant and the
// functions run in UTC. that gap is how you end up an hour out on the first
// weekend in april, so nothing in here touches the browser's local time.

export const ZONE = 'Australia/Melbourne'

const pad = (n) => String(n).padStart(2, '0')

function partsIn(date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const found = {}
  for (const part of formatter.formatToParts(date)) found[part.type] = part.value

  return {
    year: Number(found.year),
    month: Number(found.month),
    day: Number(found.day),
    // some engines give hour 24 for midnight which breaks everything below
    hour: Number(found.hour) % 24,
    minute: Number(found.minute),
    second: Number(found.second),
  }
}

// how far melbourne is from UTC right now, in ms. +10 most of the year, +11
// over summer. read from Intl rather than hardcoded in case the rules change
function offsetMs(date) {
  const p = partsIn(date)
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asIfUtc - date.getTime()
}

// melbourne date and clock fields for an instant
export function zoneParts(date) {
  const p = partsIn(date)
  return { ...p, weekday: isoWeekday(p.year, p.month, p.day) }
}

// the instant for a melbourne wall clock time. offset gets applied twice
// because the first guess can land the wrong side of a DST change, second pass
// measures the offset that actually applies. took a while to work that out
export function fromZoned(year, month, day, hour = 0, minute = 0) {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const firstPass = new Date(guess - offsetMs(new Date(guess)))
  return new Date(guess - offsetMs(firstPass))
}

// 1 = monday, 7 = sunday. matches ISO 8601 and the seed data
export function isoWeekday(year, month, day) {
  const dayNumber = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return dayNumber === 0 ? 7 : dayNumber
}

// YYYY-MM-DD in melbourne. keys a day of slots
export function isoDate(date) {
  const p = zoneParts(date)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

// key for one slot in the availability doc. no colons or full stops: a dot in
// a firestore map key reads as a path separator and quietly nests the count
export function slotKey(date) {
  const p = zoneParts(date)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}-${pad(p.minute)}`
}

const dateFormat = new Intl.DateTimeFormat('en-AU', {
  timeZone: ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const shortDateFormat = new Intl.DateTimeFormat('en-AU', {
  timeZone: ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const timeFormat = new Intl.DateTimeFormat('en-AU', {
  timeZone: ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export const formatDate = (date) => dateFormat.format(date)
export const formatShortDate = (date) => shortDateFormat.format(date)
export const formatTime = (date) => timeFormat.format(date).replace(/\s/g, '').toLowerCase()
export const formatDateTime = (date) => `${formatDate(date)}, ${formatTime(date)}`
