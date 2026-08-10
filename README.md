# Iris Health Collective

A web application for a fictional Melbourne LGBTIQ+ health charity, built for
Monash ITO5032 Assessment 3.

- **Live site:** https://iris-health-collective.web.app
- **Video demonstration:** 

The charity provides counselling, peer support and a vetted directory of
affirming GPs across Victoria. The site lets people search that directory, book
a session and read the guides without creating an account.

Three findings from the Assessment 1 research shape most of what follows:

- **Browsing leaves no trace.** The directory, resources and crisis contacts all
  work with no account and no session.
- **The exit is always there.** A Quick exit control sits in the header of every
  page and responds to the Esc key.
- **Nobody writes their own credentials.** Accreditations, ratings and inclusion
  status are computed on the server. A practice cannot award itself a badge.

## Screenshots

| Home | Find affirming care |
| --- | --- |
| ![Home page with the crisis banner and quick actions](public/images/screenshots/home.jpeg) | ![Directory in map view with filters and search radius](public/images/screenshots/directory.jpeg) |

| Book a session | Staff dashboard |
| --- | --- |
| ![Step one of the booking wizard with the slot calendar](public/images/screenshots/booking.jpeg) | ![Staff dashboard with live charts and role assignment](public/images/screenshots/dashboard.jpeg) |

The dashboard is only reachable with a staff role on the account. A member
signing in gets their bookings and nothing else.

![The same four pages at phone width](public/images/screenshots/mobile.png)

## Safety by design

A normal booking site does neither of these two things, and between them they
explain a lot of the layout decisions elsewhere.

### Crisis help in the header

Crisis help sits in the header of every page at every width, alongside Quick
exit and ahead of both the navigation and the logo. Assessment 1 set a target of
reaching a real person within a minute of landing, and that ordering is what
meets it. The support services page behind the button lists what is open right
now, because QLife closes at midnight and the page exists for the hours it is
shut.

![Crisis help on desktop and mobile, showing the persistent header control and the support services behind it](public/images/screenshots/crisis.png)

### Quick exit

Quick exit replaces the current tab with a neutral site through a
history-replacing redirect, so the back button does not return here. It also
responds to the Esc key. Its placement and labelling follow published research
on exit buttons (Turk & Hutchings, 2023).

![Pressing Quick exit replaces the tab, and the back button does not return to the site](public/images/screenshots/exit.gif)

It cannot clear a full browser history or undo a saved password. The site says
so plainly, and the digital safety guide under Resources covers what it can and
cannot do.

## Stack

Vue 3 with the Composition API, Vite, Pinia, Vue Router, Bootstrap 5.
Firebase for Authentication, Firestore, Cloud Functions and Hosting.
Zod for validation, Leaflet for maps, Chart.js for the staff dashboard,
Resend for email, pdf-lib for the booking confirmation.

## Running it locally

You need Node 22 or later, a Firebase project on the Blaze plan, and the
Firebase CLI (`npm install -g firebase-tools`).

### 1. Install

```bash
npm install
npm --prefix functions install
```

### 2. Front end configuration

Copy `.env.example` to `.env.local` and fill in the six values from
**Firebase console → Project settings → Your apps → Web app**.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These are public by design and ship in the bundle. The protection comes from the
Firestore security rules. If you are worried about storing an API key publicly, Firebase's
[official documentation on API keys](https://firebase.google.com/docs/projects/api-keys)
explains why it is expected here.

### 3. Firebase console setup

- **Authentication → Sign-in method:** enable Email/Password, Google and Anonymous
- **Firestore Database:** create it in `australia-southeast2`
- **Functions:** the region is set to `australia-southeast2` in
  `functions/index.js` and must match the database, because a Firestore trigger
  runs through Eventarc in the database's region

### 4. The one secret

Sending email needs a [Resend](https://resend.com) API key. The free tier covers
3,000 emails a month, and without a verified domain it only delivers to the
address the Resend account was created with, which is enough for a
demonstration.

```bash
firebase functions:secrets:set RESEND_API_KEY
```

The key goes to Google Secret Manager and is mounted into the function at
runtime, so it never appears in the repository, the bundle or an environment
file. `functions/.env.iris-health-collective` holds the sender address only.

### 5. Seed data

Seeding needs a service account key. **Firebase console → Project settings →
Service accounts → Generate new private key**, saved as
`seed/serviceAccountKey.json`. That path is gitignored.

```bash
npm run seed          # 40 providers, 4 services, 8 guides, 12 events
npm run set-admin     # promote an account to staff, takes an email
```

`npm run seed` is safe to run again. It never overwrites `ratingCount`,
`ratingAvg` or `ratingSum`, because those belong to the review trigger.

### 6. Deploy and run

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions

npm run dev
```

Indexes before functions, and both before `npm run dev`. The app calls the
deployed callables instead of an emulator, so booking will not work until they
are up.

```bash
npm run test:unit     # 26 unit tests over the shared date and validation logic
npm run build
firebase deploy --only hosting
```

Offline behaviour only exists in a production build. Use `npm run build` then
`npm run preview` to test it, and clear site data between builds or the service
worker will serve you the previous one.

## How it fits together

**`src/`** is a normal Vue application. Views hold layout, components hold
reusable pieces, Pinia stores hold state, and `src/services/` is the only layer
that talks to Firebase. Components never import the Firebase SDK.

**`src/lib/`** is the shared logic: Zod schemas, Melbourne timezone handling and
slot generation. A `predeploy` hook in `firebase.json` copies those three files
into `functions/lib/` before every deploy, so the browser and the server
validate against the same rules. Edit them in `src/lib/`.

**`functions/`** holds nine Cloud Functions in `australia-southeast2`. The
important one is `createBooking`: it re-parses the request with the shared
schema, then runs a Firestore transaction that reads every clashing booking and
writes the new one atomically. That is why `firestore.rules` denies every client
write to `bookings`. Preventing a double booking means reading and writing in
one operation, and a browser cannot be trusted with either.

**Firestore** holds nine collections. `providers`, `services`, `resources` and
`events` are readable by anyone. `availability` is public because it holds
counts and nothing else. `bookings`, `enquiries` and `users` are private, and
none of them accept a client write.

**Derived data is never written by hand.** `onReviewWrite` recomputes a
provider's rating and inclusion basis from its approved reviews every time one
changes, always from scratch instead of adjusting a running total.

## Against the assessment criteria

| Criterion | Where to find it |
| --- | --- |
| **A.1** Development stack | Vue 3, Vite, Pinia, Vue Router. Modular structure, 26 unit tests, ESLint and Prettier |
| **A.2** Responsiveness | Mobile first throughout, 48px touch targets, no horizontal scroll at 320px |
| **B.1** Validations | Five types in one Zod schema: required and length, format, range, cross-field, and server-side. `src/lib/schemas.js`, `src/composables/useZodForm.js` |
| **B.2** Dynamic data | Every list is Firestore backed. Directory filters, sorting and search all run over live data |
| **C.1** Authentication | Email and password, plus password reset, in `src/views/auth/` |
| **C.2** Role based access | Two roles as custom claims on the token, member and staff. Guarded routes plus `firestore.rules` as the real boundary |
| **C.3** Rating | Members submit, staff moderate, `onReviewWrite` aggregates on the server. `functions/lib/reviews.js` |
| **C.4** Security | Content Security Policy in enforcing mode, no client writes to sensitive collections, data minimisation on every form |
| **D.1** External authentication | Firebase Auth with Google sign-in and anonymous sessions that upgrade in place |
| **D.2** Email | Resend, with a PDF confirmation built by `pdf-lib` and a neutral sender when discreet reminders are on |
| **D.3** Interactive tables | Three staff tables with per column search, sorting, paging and reporting periods. `src/composables/useDataTable.js` |
| **D.4** Cloud deployment | Firebase Hosting, live at the link above |
| **E.1** Cloud Functions | Nine functions, callable and Firestore triggered. `functions/index.js` |
| **E.2** Geolocation | Leaflet with OpenStreetMap, list and map toggle, browser geolocation and a search radius |
| **E.3** Accessibility | Targets WCAG 2.2 AA. Skip link, route announcements, focus management, `aria-sort` on tables, keyboard operable maps |
| **E.4** Export | PDF booking confirmation by email, and CSV export from every staff table |
| **F.1** Innovation | Four features, below |

### F.1: the four innovative features

**1. Calendar booking with conflict management.** A three step wizard with an
accessible slot calendar. The `createBooking` transaction reads every clashing
booking and writes the new one atomically, so two people submitting the same
slot cannot both succeed. The second one gets a clear message instead of a
silent double booking. FullCalendar was tried first and dropped for a custom
picker, because its grid was mouse-first and the conflict handling is the part
being marked.

**2. Staff dashboard.** A separate area behind a role claim, with a review
moderation queue, an enquiries queue covering seven different forms, a bookings
table staff can cancel from, and role assignment.

**3. Interactive charts.** Chart.js over live Firestore data: bookings per week,
demand by service, and how each listing earned its place in the directory.

**4. Offline support.** A progressive web app that precaches the application
shell, so the crisis page and its phone numbers work with no connection. Map
tiles are cached, Firestore is deliberately network-only, and an offline banner
says which parts still work. The support services list is a static module for
this reason, so it never depends on a Firestore read.

Saved resources are a smaller fifth: guides are bookmarked to `localStorage`
rather than an account, so a record of what somebody was reading never reaches a
server.

## Notes

Iris Health Collective is fictional and built for a university assessment. The
crisis contacts throughout the application are real and current.

Card payments are not enabled. The donation form validates and submits an
expression of interest, with the payment step visibly disabled since this is a fictional chartity.
