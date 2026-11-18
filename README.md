# Phone Book

An online phone book. It keeps a safe copy of your phone contacts online. If your phone is
spoiled, stolen or lost, log in from any phone or browser and get any number.

The product name is set in one place: `APP_NAME` in `packages/shared/src/config.ts`.

## Folders

- `apps/web` â€“ website and API (Next.js, App Router, Tailwind)
- `apps/mobile` â€“ Android and iPhone app (Expo). Not built yet (Phase 2).
- `packages/shared` â€“ code used by both: phone number cleaning, input checks, settings

## Run it on your computer

```
npm install
copy .env.example apps\web\.env.local     (then fill in the keys)
npm run dev
```

Open http://localhost:3000.

If `DATABASE_URL` is empty, the app uses a small local database (PGlite) stored in
`apps/web/.data`. This only works in development. Production always needs Neon.

Make the two secret keys:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run it twice. Use one for `MASTER_KEY` and one for `INDEX_KEY`.
**Keep `MASTER_KEY` safe. If it is lost, saved contacts can never be read again.**

## Free services (all on free plans)

| What | Service | Notes |
|---|---|---|
| Website and API | Vercel Hobby | Non-commercial use only. Check Vercel's terms if you ever charge money. |
| Database | Neon (free) | Sleeps after 5 minutes idle. The first request after that is slower. The app retries by itself. |
| Email | Brevo (free) | About 300 emails a day. Needs one verified sender address. No domain needed. |
| Push notices | Expo push | Free |
| App builds | Expo EAS (free) | Limited builds. iOS builds queue slowly. |

No SMS. SMS costs money. `SmsSender` in `apps/web/lib/mailer.ts` is an empty slot for later.

## Rules the code follows

- Log in with username or phone number and a password. No email, no OTP.
- Recovery: a one-time recovery code (shown once), or a code sent to the account email.
  Rate limited. A reset logs out every session and writes a login notice.
- Web sessions end after 30 minutes idle, or 1 hour in total. Change in `config.ts`.
  No "remember me". Contacts are never kept in localStorage, IndexedDB or any cache.
  Private pages and the API send `Cache-Control: no-store`.
- Every login is listed on "Recent logins". Email notices follow the rule in `lib/notices.ts`.
- Contacts are encrypted (AES-256-GCM) with a key for each user. Phone numbers are also kept
  as a one-way fingerprint so they can be matched. Contact data is never logged.
- Sync: last write wins. The newest `updatedAt` stays.

## Database

Tables are in `apps/web/lib/db/migrations/` (`0001_init.sql`, then `0002_email_verify.sql`). To set up Neon, run each file once, in order,`n in the Neon SQL editor (use the direct connection). Keep `lib/db/schema.ts` in step with it.

