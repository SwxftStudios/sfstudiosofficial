# S&F Studios Official

Official S&F Studios frontend and backend portal. The first screen redirects to
the custom access page, then authenticated users can enter the studio portal for
showcase, services, Talent Hub, announcements, socials, profiles, and staff
administration.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- `public/login.html`, `public/login.css`, `public/login.js`: custom access UI
- `public/studio.html`, `public/studio.css`, `public/studio.js`: studio portal
- `app/api/**`: backend routes for auth, Google OAuth, Talent Hub, staff, logs, content, profile, and contact
- `db/schema.ts`: Drizzle schema for Cloudflare D1
- `drizzle/`: generated SQL migrations
- `.openai/hosting.json`: Sites config with the `DB` D1 binding enabled

## Backend Setup

The backend uses Cloudflare D1 through the binding name `DB`. After schema
changes, run:

```bash
npm run db:generate
```

The generated SQL in `drizzle/` must be applied to the deployed D1 database by
the hosting/deployment platform.

## Environment Variables

Required before production:

- `APP_SESSION_SECRET`: long random string used to hash session cookies
- `FOUNDER_EMAIL`: founder bootstrap email
- `FOUNDER_PASSWORD`: temporary founder bootstrap password

Required for Google login:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

For this site, the Google OAuth redirect URI should be:

```text
https://YOUR_DOMAIN/api/auth/google/callback
```

For local development, use:

```text
http://localhost:3000/api/auth/google/callback
```

Without Google keys, the Google button returns to the login page with a setup
message instead of completing OAuth.

## Backend Features

- Password sign up/login with server-side PBKDF2 password hashing
- HttpOnly session cookies
- Google OAuth start/callback routes
- Founder bootstrap account and default `Executives` department
- Custom staff departments and roles with per-role permissions
- Audit logs for visits, auth, profile updates, jobs, applications, staff actions, security, and contact
- Talent Hub jobs and applications
- User profiles and portfolio links
- Staff-managed content blocks for showcase, services, announcements, and socials
- Contact/service requests

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
