import { describe, expect, it } from 'vitest'
import { bookableDays, isLegalSlot, overlaps, slotsForDay } from './slots'
import { fromZoned, slotKey, zoneParts } from './timezone'

/* the rules the booking wizard and the createBooking function both depend on.
   these run against the shared modules in src/lib, and functions/lib holds a
   copy of the same files, so a change to one that breaks these is a change
   that needs making twice. */

const counselling = {
  id: 'individual-counselling',
  name: 'Individual counselling',
  durationMinutes: 50,
  capacity: 1,
  availability: {
    days: [1, 2, 3, 4, 5],
    startHour: 9,
    endHour: 17,
    slotMinutes: 60,
    leadHours: 2,
    horizonDays: 21,
  },
}

describe('Melbourne wall clock times', () => {
  it('keeps 10am at 10am on either side of daylight saving', () => {
    // daylight saving ended on 5 April 2026 and began again on 4 October
    const winter = fromZoned(2026, 7, 15, 10, 0)
    const summer = fromZoned(2026, 12, 15, 10, 0)

    expect(zoneParts(winter).hour).toBe(10)
    expect(zoneParts(summer).hour).toBe(10)

    // and the two are genuinely different instants, an hour apart in UTC
    expect(winter.getUTCHours()).toBe(0)
    expect(summer.getUTCHours()).toBe(23)
  })

  it('builds a slot key from the Melbourne date, not the UTC one', () => {
    // 15 December, 10am Melbourne, is 14 December in UTC
    const slot = fromZoned(2026, 12, 15, 10, 0)
    expect(slot.toISOString().startsWith('2026-12-14')).toBe(true)
    expect(slotKey(slot)).toBe('2026-12-15T10-00')
  })
})

describe('bookableDays', () => {
  it('only offers days the service runs', () => {
    const groupOnThursdays = { ...counselling, availability: { ...counselling.availability, days: [4] } }
    const days = bookableDays(groupOnThursdays, 3, fromZoned(2026, 8, 10, 9, 0))

    expect(days).toEqual(['2026-08-13', '2026-08-20', '2026-08-27'])
  })

  it('starts from today rather than tomorrow', () => {
    const monday = fromZoned(2026, 8, 10, 9, 0)
    expect(bookableDays(counselling, 5, monday)[0]).toBe('2026-08-10')
  })
})

describe('slotsForDay', () => {
  const monday = '2026-08-17'
  const dayBefore = fromZoned(2026, 8, 16, 9, 0)

  it('lays out the grid between the opening hours', () => {
    const slots = slotsForDay(counselling, monday, { now: dayBefore })

    // 9am to 4pm inclusive: a 50 minute session cannot start at 5pm
    expect(slots).toHaveLength(8)
    expect(slotKey(slots[0].start)).toBe('2026-08-17T09-00')
    expect(slotKey(slots.at(-1).start)).toBe('2026-08-17T16-00')
  })

  it('blocks a slot that has reached capacity', () => {
    const slots = slotsForDay(counselling, monday, {
      now: dayBefore,
      taken: { '2026-08-17T11-00': 1 },
    })
    const eleven = slots.find((slot) => slot.key === '2026-08-17T11-00')

    expect(eleven.available).toBe(false)
    expect(eleven.reason).toBe('full')
    expect(eleven.remaining).toBe(0)
  })

  it('keeps a group session open until every place is gone', () => {
    const group = { ...counselling, capacity: 8 }
    const slots = slotsForDay(group, monday, { now: dayBefore, taken: { '2026-08-17T11-00': 7 } })
    const eleven = slots.find((slot) => slot.key === '2026-08-17T11-00')

    expect(eleven.available).toBe(true)
    expect(eleven.remaining).toBe(1)
  })

  it('closes slots inside the lead time', () => {
    const tenThirty = fromZoned(2026, 8, 17, 10, 30)
    const slots = slotsForDay(counselling, monday, { now: tenThirty })

    expect(slots.find((slot) => slot.key === '2026-08-17T12-00').available).toBe(false)
    expect(slots.find((slot) => slot.key === '2026-08-17T13-00').available).toBe(true)
  })
})

describe('isLegalSlot, the server side check', () => {
  const now = fromZoned(2026, 8, 16, 9, 0)

  it('accepts a time the calendar could have drawn', () => {
    expect(isLegalSlot(counselling, fromZoned(2026, 8, 17, 9, 0), now)).toBe(true)
  })

  it('rejects a weekend', () => {
    expect(isLegalSlot(counselling, fromZoned(2026, 8, 22, 10, 0), now)).toBe(false)
  })

  it('rejects a time between the slots', () => {
    expect(isLegalSlot(counselling, fromZoned(2026, 8, 17, 9, 30), now)).toBe(false)
  })

  it('rejects a session that would run past closing', () => {
    expect(isLegalSlot(counselling, fromZoned(2026, 8, 17, 17, 0), now)).toBe(false)
  })

  it('rejects a time in the past and one beyond the horizon', () => {
    expect(isLegalSlot(counselling, fromZoned(2026, 8, 14, 10, 0), now)).toBe(false)
    expect(isLegalSlot(counselling, fromZoned(2026, 10, 30, 10, 0), now)).toBe(false)
  })
})

describe('overlaps', () => {
  const at = (hour, minute = 0) => fromZoned(2026, 8, 17, hour, minute)

  it('is true when one session runs into another', () => {
    expect(overlaps(at(10), at(10, 50), at(10, 30), at(11, 20))).toBe(true)
  })

  it('is false for sessions that only touch', () => {
    expect(overlaps(at(10), at(11), at(11), at(12))).toBe(false)
  })
})
