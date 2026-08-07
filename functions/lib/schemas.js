// shared with functions/lib, copied there at deploy by the hook in
// firebase.json. edit here, not there.

import { z } from 'zod'

// one schema for the form and for createBooking. the client copy is so you
// find out about a typo before pressing a button, the server copy is the one
// that decides.
//
// B.1 wants two validation types, there are five here:
//   required/length  chosenName, 2 to 60 chars
//   format           email and AU mobile, by pattern
//   range            notes capped at 300, slot inside the booking horizon
//   cross field      email only required if you asked for a confirmation
//   server side      reparsed in the function, then the conflict check

export const AU_MOBILE = /^04\d{8}$/
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// patterns rather than z.email() so the wording is ours, and so it behaves the
// same on zod 3 and 4
const normaliseMobile = (value) => (value ?? '').replace(/[\s-]/g, '')

export const bookingDetailsSchema = z
  .object({
    chosenName: z
      .string()
      .trim()
      .min(2, 'Enter the name you would like us to use, at least 2 characters')
      .max(60, 'Please keep the name to 60 characters or fewer'),

    pronouns: z
      .string()
      .trim()
      .max(40, 'Please keep pronouns to 40 characters or fewer')
      .default(''),

    notes: z
      .string()
      .trim()
      .max(300, 'Please keep this to 300 characters or fewer')
      .default(''),

    wantsEmail: z.boolean().default(false),
    email: z.string().trim().max(120, 'That email address is too long').default(''),

    wantsSms: z.boolean().default(false),
    mobile: z.string().trim().max(20, 'That mobile number is too long').default(''),

    discreetReminder: z.boolean().default(true),
  })
  .superRefine((values, ctx) => {
    // contact fields are only required by the checkbox above them. asking for
    // an email nobody wanted to give is the exact disclosure risk the design
    // report was about
    if (values.wantsEmail && !EMAIL.test(values.email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Enter an email like you@example.com, or turn off the emailed confirmation',
      })
    }

    if (values.wantsSms && !AU_MOBILE.test(normaliseMobile(values.mobile))) {
      ctx.addIssue({
        code: 'custom',
        path: ['mobile'],
        message: 'Enter a mobile starting with 04, or turn off text reminders',
      })
    }
  })

export const bookingRequestSchema = z.object({
  serviceId: z.string().trim().min(1, 'Choose a service'),
  startAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Choose an appointment time'),
  details: bookingDetailsSchema,
})

export const cancelRequestSchema = z.object({
  bookingId: z.string().trim().min(1),
})

// moving an anonymous booking onto an account you already had. the token is an
// id token from the anonymous session, which the function verifies, so only the
// browser that made the booking can move it
export const claimRequestSchema = z.object({
  bookingId: z.string().trim().min(1),
  previousToken: z.string().trim().min(1),
})

export const roleRequestSchema = z.object({
  email: z.string().trim().regex(EMAIL, 'Enter a valid email address'),
  role: z.enum(['member', 'provider', 'admin']),
})

// zod gives a list of issues, a form needs one message per field. first issue
// wins so you fix one thing at a time instead of seeing the same input flagged
// three different ways
export function issuesToErrors(error) {
  const errors = {}
  for (const issue of error.issues ?? []) {
    const field = issue.path?.join('.') || 'form'
    if (!errors[field]) errors[field] = issue.message
  }
  return errors
}

export const firstMessage = (error) =>
  error.issues?.[0]?.message ?? 'Please check the details and try again'

// drops the contact fields nobody asked to give so they never get stored
export function minimiseDetails(details) {
  return {
    chosenName: details.chosenName,
    pronouns: details.pronouns || null,
    notes: details.notes || null,
    email: details.wantsEmail ? details.email : null,
    mobile: details.wantsSms ? normaliseMobile(details.mobile) : null,
    discreetReminder: details.discreetReminder,
  }
}
