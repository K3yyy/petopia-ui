# Petopia UI

Next.js App Router frontend for the Petopia API. This project uses JavaScript, Tailwind CSS, reusable shadcn-style UI primitives, Lucide icons, React Hook Form, Zod, and one Axios client.

## Run locally

```powershell
npm install
npm run dev
```

Configure `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The API URL defaults to `http://localhost:5000/api`. Only Supabase's public URL and publishable/anon key belong in the frontend; never add service-role, secret, Google client-secret, or backend JWT credentials.

### Google OAuth setup

1. In Supabase Authentication → Providers → Google, enable Google and enter the Google OAuth client ID and client secret.
2. In Google Cloud, add `http://localhost:3000` as an authorized JavaScript origin. Add the Supabase callback URL shown in the Supabase Google provider settings (usually `https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI.
3. In Supabase Authentication → URL Configuration, add `http://localhost:3000/auth/callback` to the allowed redirect URLs. Add the equivalent production callback URL when deploying.
4. Restart `npm run dev` after changing `.env.local`.

The browser uses Supabase's PKCE flow and exchanges the callback code once. The resulting Supabase access token is attached to protected Petopia API calls. Supabase keeps the refreshable session; a local access-token copy is maintained for the existing API client and cleared on logout/expiration.

## Connected API areas

- Auth: register, login, logout, and current identity.
- Profiles: read/update current profile and request seller verification.
- Pets: public browse/search/filter, detail, create/edit/delete, my listings, and applications.
- Pet media: list, upload, choose primary image, and delete.
- Applications: apply, list mine, review owned pet applications, details, and status changes.
- Lost and found: public listing/filter, create, detail/update/status/delete, and image upload.
- Messages: conversations, unread count, read thread, send, mark read, and delete own messages.
- Fundraising: list/detail/progress, create/update/submit, donations, and admin review.
- Payments: create cash requests, personal/seller history, details, and seller cash confirmation.

All calls use the backend's `{ success, message, data }` envelope. Supabase persists the refreshable browser session, and the API client sends its current access token as a bearer token. Do not put backend or Supabase service credentials in this project.

## Backend constraints reflected in the UI

- Email/password registration through the backend provisions a profile row and trusted `app_metadata.profile_id`. Google OAuth authenticates with Supabase but does not create or link a profile row; profile-dependent API features remain unavailable until an administrator provisions trusted `app_metadata.profile_id`. The frontend uses the profile returned by `/auth/me` and never maps UUIDs to BIGINT IDs.
- The API has no current-user lost/found report listing endpoint, so "My reports" is shown as unavailable.
- Bakong KHQR creation is unavailable in the backend. Bakong payment initiation is disabled; cash payment requests and seller confirmation use existing endpoints.
- Admin user management, pending verification/campaign queues, general admin listing moderation, and an admin payment list are absent. Admin review is limited to supported seller and campaign decisions by ID.
- The API has no public seller profile lookup, so no seller profile page is fabricated.

## Checks

```powershell
npm run lint
npm run build
```
