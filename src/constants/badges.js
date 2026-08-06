/* badge definitions live here, not in components. a badge is a claim with an
   issuer and an expiry, so adding one means adding an object rather than
   editing views.

   externallyIssued means someone other than the charity grants it, which is
   what lets a listing count as "accredited" rather than "reviewed by us". */

export const BADGES = {
  'rainbow-tick': {
    label: 'Rainbow Tick',
    short: 'Accredited against national LGBTIQ inclusive practice standards.',
    issuer: 'Rainbow Health Australia / QIP',
    externallyIssued: true,
    validityMonths: 36,
  },
  'informed-consent': {
    label: 'Informed consent',
    short: 'Provides gender affirming care on an informed consent basis.',
    issuer: 'Iris Health Collective review',
    externallyIssued: false,
    validityMonths: 12,
  },
  'hiv-experienced': {
    label: 'HIV experienced',
    short: 'Prescriber experience in HIV care, PrEP and PEP.',
    issuer: 'ASHM prescriber list',
    externallyIssued: true,
    validityMonths: 24,
  },
  'trans-led': {
    label: 'Trans led',
    short: 'Service is led or co-designed by trans and gender diverse people.',
    issuer: 'Iris Health Collective review',
    externallyIssued: false,
    validityMonths: 24,
  },
}

// how a listing earned its place. computed server side, never typed by hand.
export const INCLUSION_BASIS = {
  accredited: 'Accredited practice',
  'community-endorsed': 'Community endorsed',
  'charity-verified': 'Reviewed by our team',
}

export const badgeLabel = (code) => BADGES[code]?.label ?? code

// only a live verified claim renders as a solid badge
export const isLive = (claim) => claim.status === 'verified'
