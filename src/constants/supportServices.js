/* every helpline on the crisis pages.

   a static module on purpose, not firestore. the crisis route is precached so
   it works offline, and a page of phone numbers that goes blank without a
   connection is worse than useless. these change about once a year, so a
   deploy is the right way to change them.

   numbers checked against qlife.org.au/get-help, which maintains the list the
   sector works from. hours are the ones each service publishes. */

export const ALWAYS_OPEN = [
  {
    name: 'Lifeline',
    detail: 'Crisis support and suicide prevention, for anyone, any time.',
    phone: '13 11 14',
    tel: '131114',
    hours: '24 hours, every day',
    url: 'https://www.lifeline.org.au',
  },
  {
    name: 'Beyond Blue',
    detail: 'Mental health support, counselling and referral.',
    phone: '1300 22 4636',
    tel: '1300224636',
    hours: '24 hours, every day',
    url: 'https://www.beyondblue.org.au',
  },
  {
    name: 'Suicide Call Back Service',
    detail: 'Counselling for anyone affected by suicide, including by phone, video or online.',
    phone: '1300 659 467',
    tel: '1300659467',
    hours: '24 hours, every day',
    url: 'https://www.suicidecallbackservice.org.au',
  },
  {
    name: '13YARN',
    detail:
      'Crisis support for Aboriginal and Torres Strait Islander people, answered by Aboriginal and Torres Strait Islander Crisis Supporters.',
    phone: '13 92 76',
    tel: '139276',
    hours: '24 hours, every day',
    url: 'https://www.13yarn.org.au',
  },
]

export const COMMUNITY_SPECIFIC = [
  {
    name: 'QLife',
    detail: 'Anonymous LGBTIQ+ peer support and referral, by phone or webchat.',
    phone: '1800 184 527',
    tel: '1800184527',
    hours: '3pm – 9pm, every day',
    url: 'https://qlife.org.au',
  },
  {
    name: 'Rainbow Sexual, Domestic and Family Violence Helpline',
    detail: 'Specialist support for LGBTIQA+ people experiencing violence or abuse.',
    phone: '1800 497 212',
    tel: '1800497212',
    hours: '24 hours, every day',
    url: 'https://fullstop.org.au/get-help/our-services/rainbowviolenceandabusesupport',
  },
  {
    name: '1800RESPECT',
    detail: 'National sexual assault, domestic and family violence counselling.',
    phone: '1800 737 732',
    tel: '1800737732',
    hours: '24 hours, every day',
    url: 'https://www.1800respect.org.au',
  },
  {
    name: 'Kids Helpline',
    detail: 'Counselling for anyone aged 5 to 25, by phone, webchat or email.',
    phone: '1800 55 1800',
    tel: '1800551800',
    hours: '24 hours, every day',
    url: 'https://kidshelpline.com.au',
  },
  {
    name: 'MensLine Australia',
    detail: 'Counselling for men, including relationship and family concerns.',
    phone: '1300 78 99 78',
    tel: '1300789978',
    hours: '24 hours, every day',
    url: 'https://mensline.org.au',
  },
]

// the number to call in Victoria for an acute mental health assessment. other
// states are listed too, because someone reading this may not be here
export const TRIAGE = [
  { state: 'Victoria', detail: 'Find your area team through Better Health Victoria.', url: 'https://www.betterhealth.vic.gov.au/health/servicesandsupport/urgent-treatment-for-mental-illness' },
  { state: 'New South Wales', phone: '1800 011 511', tel: '1800011511' },
  { state: 'Queensland', phone: '1300 642 255', tel: '1300642255' },
  { state: 'South Australia', phone: '13 14 65', tel: '131465' },
  { state: 'Western Australia', phone: '1300 555 788', tel: '1300555788', detail: 'Metro. Peel 1800 676 822, country 1800 552 002.' },
  { state: 'Northern Territory', phone: '1800 682 288', tel: '1800682288' },
  { state: 'Australian Capital Territory', phone: '1800 629 354', tel: '1800629354' },
  { state: 'Tasmania', phone: '1800 332 388', tel: '1800332388' },
]

export const ONLINE = [
  { name: 'Charlee', detail: 'LGBTIQA+ suicide prevention hub.', url: 'https://www.charlee.org.au' },
  { name: 'TransHub', detail: 'Health information for trans and gender diverse people.', url: 'https://www.transhub.org.au' },
  { name: 'SANE Community Forums', detail: 'Moderated peer forums for mental health.', url: 'https://saneforums.org' },
  { name: 'QLife service directory', detail: 'National and state LGBTIQA+SB services.', url: 'https://qlife.org.au/resources/directory' },
]

export const INTERNATIONAL = [
  { name: 'Befrienders Worldwide', detail: 'Crisis lines by country, with a section on sexual orientation and gender.', url: 'https://www.befrienders.org' },
  { name: 'International Association for Suicide Prevention', detail: 'Crisis centre directory.', url: 'https://www.iasp.info' },
  { name: 'The Trevor Project', detail: 'Crisis support for LGBTQ young people, United States.', url: 'https://www.thetrevorproject.org' },
  {
    name: 'ILGA World',
    detail:
      'The International Lesbian, Gay, Bisexual, Trans and Intersex Association. Member organisations searchable by country.',
    url: 'https://www.ilga.org',
  },
  { name: 'Amnesty International', detail: 'For help seeking asylum from persecution.', url: 'https://www.amnesty.org' },
]
