import { describe, expect, it } from 'vitest'
import { bookingDetailsSchema, issuesToErrors, minimiseDetails } from './schemas'

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
