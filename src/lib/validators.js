/* small shared validators. the booking form on day 4 brings zod for its schema,
   these cover the auth forms where the rules are short.

   messages say what to do rather than what went wrong, so someone can fix the
   field without guessing. */

export const required = (value, field = 'This field') =>
  value?.trim() ? '' : `Enter your ${field.toLowerCase()}`

export const email = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim() ?? '')
    ? ''
    : 'Enter an email address, like you@example.com'

export const minLength = (value, n, field = 'This') =>
  (value ?? '').length >= n ? '' : `${field} needs to be at least ${n} characters`

export const matches = (a, b, message) => (a === b ? '' : message)

export const auMobile = (value) =>
  !value?.trim() || /^04\d{8}$/.test(value.replace(/\s/g, ''))
    ? ''
    : 'Enter a mobile starting with 04, or leave this blank'

// strips empty messages so the caller gets only real errors
export const collect = (checks) =>
  Object.fromEntries(Object.entries(checks).filter(([, message]) => message))
