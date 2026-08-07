import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatDate, formatTime } from './timezone.js'

// the D.2 attachment, pdf-lib.
//
// built here rather than in the browser for two reasons: the same file has to
// go on an email, and generating it client side means trusting whatever the
// browser says about a booking the server owns

// brand purple and ink out of tokens.css. pdf-lib wants 0 to 1 channels
const PURPLE = rgb(0.322, 0.18, 0.388)
const INK = rgb(0.141, 0.231, 0.278)
const MUTED = rgb(0.337, 0.416, 0.459)
const PAGE = { width: 595.28, height: 841.89 } // A4 in points
const MARGIN = 56

export async function buildConfirmationPdf(booking) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Appointment confirmation ${booking.reference}`)
  pdf.setAuthor('Iris Health Collective')
  pdf.setSubject('Appointment confirmation')

  const page = pdf.addPage([PAGE.width, PAGE.height])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const start = booking.startAt.toDate ? booking.startAt.toDate() : new Date(booking.startAt)
  const end = booking.endAt.toDate ? booking.endAt.toDate() : new Date(booking.endAt)

  // header band
  page.drawRectangle({ x: 0, y: PAGE.height - 120, width: PAGE.width, height: 120, color: PURPLE })
  page.drawText('Iris Health Collective', {
    x: MARGIN,
    y: PAGE.height - 62,
    size: 20,
    font: bold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Appointment confirmation', {
    x: MARGIN,
    y: PAGE.height - 88,
    size: 12,
    font: regular,
    color: rgb(0.96, 0.9, 1),
  })

  let y = PAGE.height - 168
  const maxWidth = PAGE.width - MARGIN * 2

  // pdf-lib draws a string exactly as given, so anything that could be long
  // has to be wrapped first. the next block starts below whatever this one
  // used rather than a fixed distance down, a 300 char note is four lines and
  // a fixed gap put it straight through the divider
  const wrap = (text, font, size) => {
    const lines = []
    for (const paragraphText of String(text ?? '').split('\n')) {
      let current = ''
      for (const word of paragraphText.split(' ')) {
        const candidate = current ? `${current} ${word}` : word
        if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
          lines.push(current)
          current = word
        } else {
          current = candidate
        }
      }
      lines.push(current)
    }
    return lines
  }

  const draw = (text, { font = regular, size = 10, leading = 15, gap = 8 } = {}) => {
    for (const lineText of wrap(text, font, size)) {
      page.drawText(lineText, { x: MARGIN, y, size, font, color: INK })
      y -= leading
    }
    y -= gap
  }

  const field = (label, value) => {
    page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 8, font: bold, color: MUTED })
    y -= 15
    draw(value, { size: 12, leading: 16, gap: 19 })
  }

  page.drawText(booking.reference, { x: MARGIN, y, size: 22, font: bold, color: PURPLE })
  y -= 42

  field('Session', `${booking.serviceName} with ${booking.practitionerName}`)
  field('When', `${formatDate(start)}, ${formatTime(start)} to ${formatTime(end)}`)
  field('Where', booking.location)
  field(
    'We will call you',
    booking.pronouns ? `${booking.chosenName} (${booking.pronouns})` : booking.chosenName,
  )

  if (booking.notes) field('What you told us', booking.notes)

  // divider, then the standing notes
  y -= 8
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE.width - MARGIN, y },
    thickness: 1,
    color: rgb(0.83, 0.87, 0.89),
  })
  y -= 28

  draw('Before you come', { font: bold, size: 11, leading: 16 })
  draw(
    'There is nothing to prepare and nothing to bring. If you would rather not sit in a waiting room, tell reception your reference number and they will find you somewhere quieter.',
  )
  draw(
    'To change or cancel, sign in at iris-health-collective.web.app or reply to this email. There is no cancellation fee and no explanation required.',
  )

  draw('If you need support before then', { font: bold, size: 11, leading: 16 })
  draw(
    'QLife, 1800 184 527, 3pm to midnight every day. In an emergency, call 000. You do not need to give your name to get help.',
  )

  // the service is made up, the crisis numbers above it aren't. this line
  // stays on every document that leaves the system
  page.drawText(
    'Iris Health Collective is a fictional service built for a university assessment.',
    { x: MARGIN, y: 64, size: 8, font: regular, color: MUTED },
  )
  page.drawText('The crisis contacts in this document are real and current.', {
    x: MARGIN,
    y: 52,
    size: 8,
    font: regular,
    color: MUTED,
  })

  return pdf.save()
}
