import { fromZoned, zoneParts } from '@/lib/timezone'

/* calendar ranges for the staff tables. reporting periods, not rolling
   windows: "this month" means the first of the month to the last day of it,
   which is the figure somebody is asked for in a meeting, rather than the
   last thirty days.

   boundaries come from the melbourne helpers rather than the browser clock,
   for the same reason the booking slots do. a laptop left on UTC would start
   and end every period an evening early. */

export const DATE_RANGES = {
  all: 'All time',
  week: 'This week',
  month: 'This month',
  year: 'This year',
}

// null means no bound in that direction, so all time needs no special case
export function rangeBounds(key, now = new Date()) {
  const { year, month, day, weekday } = zoneParts(now)

  // weeks run monday to sunday, matching isoWeekday and the seed availability.
  // out of range day and month numbers roll over on their own, so the first of
  // january minus a few days lands in december without any arithmetic here
  switch (key) {
    case 'week':
      return {
        start: fromZoned(year, month, day - weekday + 1),
        end: fromZoned(year, month, day - weekday + 8),
      }
    case 'month':
      return { start: fromZoned(year, month, 1), end: fromZoned(year, month + 1, 1) }
    case 'year':
      return { start: fromZoned(year, 1, 1), end: fromZoned(year + 1, 1, 1) }
    default:
      return { start: null, end: null }
  }
}

export function withinRange(date, key, now = new Date()) {
  if (key === 'all' || !key) return true
  // a row with no date at all is never in a named period. it still shows under
  // all time, so nothing disappears without the range saying so
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false

  const { start, end } = rangeBounds(key, now)
  return date >= start && date < end
}
