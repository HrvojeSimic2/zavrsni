This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase database (migrations)

This repo includes Supabase migrations in `supabase/migrations`.

### Local dev

```bash
npm run supabase:start
npm run supabase:reset
```

If you see errors like:

- `PGRST205 ... Could not find the table 'public.reservations' in the schema cache`
- `42501 ... new row violates row-level security policy for table "tours"`

it usually means your DB isn’t up-to-date with the latest migrations (reset/apply migrations, then restart Supabase).

### Hosted Supabase project

Push migrations to your linked project:

```bash
npm run supabase:push
```

If PostgREST still can’t see newly created tables immediately, reload the schema cache from the SQL editor:

```sql
select pg_notify('pgrst', 'reload schema');
```

## Guide applications (Become a Guide)

- User form: `/{locale}/become-guide` submits to `POST /api/guide-applications` (stored in `public.guide_applications`).
- Admin review UI: `/{locale}/admin/guide-applications` with per-application decision page at `/{locale}/admin/guide-applications/:id`.
- Decisions:
  - **Accept** → upserts a row in `public.guides` with `verified=false`
  - **Accept as verified account** → upserts a row in `public.guides` with `verified=true`
  - **Decline** → application status updated only

### Required env

- `SUPABASE_SERVICE_ROLE_KEY`: server-side key used to list/review applications and upsert `guides`.
- `ADMIN_EMAILS`: comma-separated admin emails allowed to access the admin review UI (e.g. `ADMIN_EMAILS=admin@example.com,admin2@example.com`).

### Optional email (Resend)

If set, new applications email the admins with a link to the review screen:

- `RESEND_API_KEY`
- `RESEND_FROM` (e.g. `Peregrine <noreply@yourdomain.com>`)
- `NEXT_PUBLIC_SITE_URL` (used to build the review link, e.g. `http://localhost:3000`)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
