import { describe, expect, it } from 'vitest'
import {
  bookingDetailsSchema,
  enquirySchema,
  issuesToErrors,
  minimiseDetails,
  minimiseEnquiry,
  resolveLocation,
  resolveModality,
} from './schemas'

/* B.1 lives or dies on these. the same schema runs in createBooking, so a rule
   proven here is a rule the server enforces. */

const base = {
  chosenName: 'Sam',
  pronouns: '',
  notes: '',
  wantsEmail: false,
  email: '',
  wantsSms: false,
  mobile: '',
  discreetReminder: true,
}

const errorsFor = (input) => {
  const result = bookingDetailsSchema.safeParse(input)
  return result.success ? {} : issuesToErrors(result.error)
}

describe('required and length', () => {
  it('needs a chosen name of at least two characters', () => {
    expect(errorsFor({ ...base, chosenName: 'S' }).chosenName).toMatch(/at least 2/)
  })

  it('rejects a name over sixty characters', () => {
    expect(errorsFor({ ...base, chosenName: 'a'.repeat(61) }).chosenName).toMatch(/60 characters/)
  })

  it('trims before it measures, so spaces are not a name', () => {
    expect(errorsFor({ ...base, chosenName: '   ' }).chosenName).toBeDefined()
  })
})

describe('format', () => {
  it('accepts an Australian mobile and rejects a landline', () => {
    expect(errorsFor({ ...base, wantsSms: true, mobile: '0412 345 678' }).mobile).toBeUndefined()
    expect(errorsFor({ ...base, wantsSms: true, mobile: '03 9123 4567' }).mobile).toMatch(/04/)
  })

  it('rejects an address with no domain', () => {
    expect(errorsFor({ ...base, wantsEmail: true, email: 'sam@' }).email).toBeDefined()
  })
})

describe('range', () => {
  it('caps the notes field at three hundred characters', () => {
    expect(errorsFor({ ...base, notes: 'a'.repeat(301) }).notes).toMatch(/300/)
    expect(errorsFor({ ...base, notes: 'a'.repeat(300) }).notes).toBeUndefined()
  })
})

describe('cross field', () => {
  it('only asks for an email when a confirmation was requested', () => {
    expect(errorsFor({ ...base, wantsEmail: false, email: '' }).email).toBeUndefined()
    expect(errorsFor({ ...base, wantsEmail: true, email: '' }).email).toBeDefined()
  })

  it('only asks for a mobile when a reminder was requested', () => {
    expect(errorsFor({ ...base, wantsSms: false, mobile: '' }).mobile).toBeUndefined()
    expect(errorsFor({ ...base, wantsSms: true, mobile: '' }).mobile).toBeDefined()
  })
})

describe('data minimisation', () => {
  it('drops contact details nobody asked to give', () => {
    const parsed = bookingDetailsSchema.parse({
      ...base,
      email: 'typed@example.com',
      mobile: '0412345678',
    })
    const stored = minimiseDetails(parsed)

    expect(stored.email).toBeNull()
    expect(stored.mobile).toBeNull()
  })

  it('keeps them when they were', () => {
    const parsed = bookingDetailsSchema.parse({
      ...base,
      wantsEmail: true,
      email: 'sam@example.com',
      wantsSms: true,
      mobile: '0412 345 678',
    })
    const stored = minimiseDetails(parsed)

    expect(stored.email).toBe('sam@example.com')
    expect(stored.mobile).toBe('0412345678')
  })

  it('never stores a gender field, because the form never asks for one', () => {
    const stored = minimiseDetails(bookingDetailsSchema.parse(base))
    expect(Object.keys(stored)).not.toContain('gender')
  })
})

describe('contact enquiry', () => {
  const enquiry = {
    topic: 'general',
    message: 'I would like to know whether you run evening sessions.',
    name: '',
    wantsReply: false,
    email: '',
  }

  const enquiryErrors = (input) => {
    const result = enquirySchema.safeParse(input)
    return result.success ? {} : issuesToErrors(result.error)
  }

  it('takes a message with no name and no email, so you can write anonymously', () => {
    expect(enquiryErrors(enquiry)).toEqual({})
  })

  it('rejects a topic that is not on the dropdown', () => {
    expect(enquiryErrors({ ...enquiry, topic: 'refunds' }).topic).toBeDefined()
  })

  it('wants a message of some substance', () => {
    expect(enquiryErrors({ ...enquiry, message: 'hi' }).message).toMatch(/at least 10/)
    expect(enquiryErrors({ ...enquiry, message: 'a'.repeat(1001) }).message).toMatch(/1000/)
  })

  it('only asks for an email once a reply has been requested', () => {
    expect(enquiryErrors({ ...enquiry, wantsReply: false, email: '' }).email).toBeUndefined()
    expect(enquiryErrors({ ...enquiry, wantsReply: true, email: '' }).email).toBeDefined()
    expect(
      enquiryErrors({ ...enquiry, wantsReply: true, email: 'sam@example.com' }).email,
    ).toBeUndefined()
  })

  it('drops an email typed and then unticked', () => {
    const parsed = enquirySchema.parse({ ...enquiry, email: 'typed@example.com' })
    expect(minimiseEnquiry(parsed).email).toBeNull()
  })
})

/* createBooking runs resolveModality on whatever the browser sent, so these
   are the rules the server enforces rather than a courtesy in the form. */

describe('how a session is attended', () => {
  const both = {
    modality: 'both',
    location: 'Room 2, Fitzroy, or a telehealth link',
    locations: { 'in-person': 'Room 2, Fitzroy', telehealth: 'A link, sent with your confirmation' },
  }

  const telehealthOnly = { modality: 'telehealth', location: 'A link' }

  it('answers for itself when the service is only offered one way', () => {
    expect(resolveModality(telehealthOnly, '')).toBe('telehealth')
  })

  it('ignores a request for a way the service is not offered', () => {
    expect(resolveModality(telehealthOnly, 'in-person')).toBe('telehealth')
  })

  it('needs an answer when the service is offered both ways', () => {
    expect(resolveModality(both, '')).toBeNull()
    expect(resolveModality(both, 'both')).toBeNull()
    expect(resolveModality(both, 'in-person')).toBe('in-person')
  })

  it('never leaves a booking saying both, which is the offer not the appointment', () => {
    for (const requested of ['', 'both', 'telehealth', 'in-person', 'carrier pigeon']) {
      expect(resolveModality(both, requested)).not.toBe('both')
    }
  })

  it('gives the address that matches the choice', () => {
    expect(resolveLocation(both, 'in-person')).toBe('Room 2, Fitzroy')
    expect(resolveLocation(both, 'telehealth')).toMatch(/link/)
  })

  it('falls back to the single location for a service without a per modality one', () => {
    expect(resolveLocation(telehealthOnly, 'telehealth')).toBe('A link')
    expect(resolveLocation({}, 'telehealth')).toMatch(/confirm the location/)
  })
})
