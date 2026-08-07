import { Resend } from 'resend'
import { formatDate, formatTime } from './timezone.js'

// the D.2 send, via Resend.
//
// envelope and contents get treated separately, and that's the bit worth
// saying out loud in the demo. with discreet on, the sender name and subject
// give away nothing, because those are what show in a notification on a shared
// phone. the detail goes in the attachment, which you have to open the message
// to reach

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export async function sendConfirmation({ apiKey, from, overrideTo, booking, pdfBase64 }) {
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')

  const resend = new Resend(apiKey)
  const discreet = booking.discreetReminder !== false
  const start = booking.startAt.toDate ? booking.startAt.toDate() : new Date(booking.startAt)
  const when = `${formatDate(start)} at ${formatTime(start)}`

  const senderName = discreet ? 'Appointments' : 'Iris Health Collective'
  const subject = discreet
    ? `Your appointment on ${formatDate(start)}`
    : `Your ${booking.serviceName} booking, ${formatDate(start)}`

  // without a verified domain Resend only delivers to the address the account
  // was set up with. the override sends everything there and notes who it was
  // meant for, so the flow demos end to end before there's a domain
  const intended = booking.email
  const to = overrideTo || intended

  const heading = discreet ? 'Your appointment is confirmed' : `${booking.serviceName} confirmed`
  const detailBlock = discreet
    ? `<p style="margin:0 0 6px"><strong>${escapeHtml(when)}</strong></p>
       <p style="margin:0;color:#566a75">Reference ${escapeHtml(booking.reference)}. The attached PDF has the full detail.</p>`
    : `<p style="margin:0 0 6px"><strong>${escapeHtml(when)}</strong></p>
       <p style="margin:0 0 6px">${escapeHtml(booking.serviceName)} with ${escapeHtml(booking.practitionerName)}</p>
       <p style="margin:0;color:#566a75">${escapeHtml(booking.location)}</p>`

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#243b47;max-width:560px">
  <h1 style="font-size:20px;color:#522e63;margin:0 0 16px">${escapeHtml(heading)}</h1>
  <p style="margin:0 0 16px">Hello ${escapeHtml(booking.chosenName)},</p>
  <div style="background:#faeeff;border-radius:14px;padding:16px 18px;margin:0 0 16px">${detailBlock}</div>
  <p style="margin:0 0 16px">Your confirmation is attached as a PDF.</p>
  <p style="margin:0 0 16px">To change or cancel, sign in at
    <a href="https://iris-health-collective.web.app/account" style="color:#522e63">iris-health-collective.web.app</a>.
    There is no cancellation fee and no explanation required.</p>
  <p style="margin:0 0 16px;color:#566a75;font-size:13px">
    Need support before then? QLife, 1800 184 527, 3pm to midnight every day. In an emergency, call 000.
  </p>
  ${overrideTo && intended !== overrideTo ? `<p style="font-size:12px;color:#8e1b36">Demonstration mode: this was addressed to ${escapeHtml(intended)}.</p>` : ''}
  <hr style="border:none;border-top:1px solid #d4dde2;margin:20px 0" />
  <p style="margin:0;font-size:11px;color:#566a75">
    Iris Health Collective is a fictional service built for a university assessment.
    The crisis contacts above are real and current.
  </p>
</div>`

  const text = [
    heading,
    '',
    `Hello ${booking.chosenName},`,
    '',
    when,
    discreet ? `Reference ${booking.reference}.` : `${booking.serviceName} with ${booking.practitionerName}`,
    discreet ? 'The attached PDF has the full detail.' : booking.location,
    '',
    'To change or cancel, sign in at https://iris-health-collective.web.app/account',
    '',
    'QLife, 1800 184 527, 3pm to midnight every day. In an emergency, call 000.',
    '',
    'Iris Health Collective is a fictional service built for a university assessment.',
    'The crisis contacts above are real and current.',
  ].join('\n')

  const { data, error } = await resend.emails.send({
    from: `${senderName} <${from}>`,
    to: [to],
    subject,
    html,
    text,
    attachments: [
      {
        filename: `appointment-${booking.reference}.pdf`,
        content: pdfBase64,
        contentType: 'application/pdf',
      },
    ],
  })

  // the SDK returns errors instead of throwing them, so skipping this check
  // records every failure as a success. caught that the hard way
  if (error) throw new Error(error.message ?? 'Resend rejected the message')

  return data
}
