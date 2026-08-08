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

/* the contact form. the page promises twice that you can write to us without
   saying who you are, and the complaints section says you can complain
   anonymously, so email is only required once you have asked for a reply. same
   cross field rule as the booking form, for the same reason. */

export const ENQUIRY_TOPICS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'events', label: 'Events' },
  { value: 'donation', label: 'Making a donation' },
  { value: 'feedback', label: 'Giving feedback' },
  { value: 'complaint', label: 'Making a complaint' },
]

export const ENQUIRY_TOPIC_VALUES = ENQUIRY_TOPICS.map((topic) => topic.value)

export const ENQUIRY_MESSAGE_MAX = 1000

export const enquirySchema = z
  .object({
    // a refine rather than z.enum, so the wording is ours and the list stays
    // the one the dropdown renders
    topic: z
      .string()
      .trim()
      .refine((value) => ENQUIRY_TOPIC_VALUES.includes(value), 'Choose what your message is about')
      .default('general'),

    message: z
      .string()
      .trim()
      .min(10, 'Tell us a little more, at least 10 characters')
      .max(ENQUIRY_MESSAGE_MAX, `Please keep your message to ${ENQUIRY_MESSAGE_MAX} characters or fewer`),

    name: z.string().trim().max(60, 'Please keep the name to 60 characters or fewer').default(''),

    wantsReply: z.boolean().default(false),
    email: z.string().trim().max(120, 'That email address is too long').default(''),
  })
  .superRefine((values, ctx) => {
    if (values.wantsReply && !EMAIL.test(values.email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Enter an email like you@example.com, or untick the reply request',
      })
    }
  })

// nothing identifying is kept unless it was given to be replied to
export function minimiseEnquiry(enquiry) {
  return {
    topic: enquiry.topic,
    message: enquiry.message,
    name: enquiry.name || null,
    email: enquiry.wantsReply ? enquiry.email : null,
  }
}

/* reviews. C.3.

   the rating is the range check, the comment is the length check, and the
   display name is optional because someone reviewing a sexual health clinic
   may not want their name against it. */

export const REVIEW_COMMENT_MAX = 600

export const reviewSchema = z.object({
  // coerce because a radio input hands back a string
  rating: z.coerce
    .number()
    .int('Choose a rating')
    .min(1, 'Choose a rating from 1 to 5')
    .max(5, 'Choose a rating from 1 to 5'),

  // optional. a rating on its own is a review, and plenty of the listings
  // already carry a count with nothing written behind it
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX, `Please keep this to ${REVIEW_COMMENT_MAX} characters or fewer`)
    .default(''),

  displayName: z
    .string()
    .trim()
    .max(40, 'Please keep the name to 40 characters or fewer')
    .default(''),
})

export const reviewRequestSchema = z.object({
  providerId: z.string().trim().min(1),
  review: reviewSchema,
})

export const moderationRequestSchema = z.object({
  providerId: z.string().trim().min(1),
  reviewId: z.string().trim().min(1),
  decision: z.enum(['approved', 'rejected']),
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

