# Vanguard

Vanguard is an internal blog-like platform, inspired by [PlanetScale's Beam](https://github.com/planetscale/beam).

Built on **React Router v7 + Drizzle + Vercel Blob**, deployed on Vercel.

An excerpt in how we describe this at Sentry:

> Vanguard has been designed to provide a way to create permanence around
> timely internal moments at Sentry. While the core of it is a simple
> blog, it's intending to continuously enable the culture of sharing what
> we're building at Sentry. Additionally we have recognized the need to
> create more long lasting moments out of things that are top of mind,
> which we're dubbing as 'Strategy' in this context. You'll see several
> historical posts by myself of this nature.

**Note: This project is a work in progress, and is primarily intended for Sentry use. Our hope is that we can keep it generic enough that its usable elsewhere, but that may require effort from the open source community.**

![screenshot of vanguard](/screenshot.png?raw=true)

## Deployment

Vanguard is designed for **Vercel deployment** with [Neon Postgres](https://neon.tech) and [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) storage.

See the [React Router on Vercel guide](https://vercel.com/docs/frameworks/react-router) for deployment details. Neon's branching feature integrates cleanly with Vercel Preview Deployments — each preview branch can point at its own Neon branch.

You will need to ensure a few key values are set in production:

```sh
# Generate with: openssl rand -hex 32
SESSION_SECRET=
# Neon connection string
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Google Auth

Google OAuth is the **only** authentication method. It works in both local development (against `http://localhost:5173`) and production. To configure:

```sh
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Restrict login to your Google Workspace domain
GOOGLE_HD=your-google-workspace-domain.com
```

Ensure your OAuth client in the Google Cloud Console has every environment's callback URL registered as an Authorized redirect URI:

- Local dev: `http://localhost:5173/auth/google/callback`
- Production: `https://<your-domain>/auth/google/callback`

The first user to sign in on an empty database is automatically granted admin rights — this bootstraps the initial admin on a fresh install. Subsequent users sign in as regular users; promote them with `pnpm user make-admin <email>`.

### Sentry

```sh
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

### Image Storage (Vercel Blob)

Avatars and image attachments are stored in [Vercel Blob](https://vercel.com/docs/storage/vercel-blob). After linking your project on Vercel, run:

```sh
vercel env pull
```

This populates `BLOB_READ_WRITE_TOKEN` in your local `.env`. In production, Vercel sets this automatically.

For local development without a Vercel account, leave `BLOB_READ_WRITE_TOKEN` empty — uploads fall back to local filesystem storage served via `/image-uploads/...`.

### Outbound Email

Outbound email is used for publishing new posts and receiving comment notifications. Configure SMTP (e.g. Sendgrid):

```sh
SMTP_FROM=vanguard@example.com
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Development

- Install required tooling:
  - [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
  - Node 24.x (LTS)
  - [Vite+ (`vp`)](https://viteplus.dev/) — used for linting, formatting, and static checks

- Copy environment config:

  ```sh
  cp .env.example .env
  ```

- Start Postgres in [Docker](https://www.docker.com/get-started):

  ```sh
  docker-compose up -d
  ```

  Alternatively, point `DATABASE_URL` at a [Neon](https://neon.tech) dev branch.

- Install dependencies and migrate the database:

  ```sh
  pnpm install
  pnpm db:migrate:dev
  ```

- **Optional**: Seed the database with demo content:

  ```sh
  pnpm db:seed
  ```

  This creates:
  - A placeholder `demo@example.com` user (no sign-in; owns the sample content)
  - A sample "General" category
  - Three sample posts

  The seed script is safe to run multiple times — it won't create duplicates.

  You still sign in with your own Google account; the seed exists only to give you content to browse on first boot.

- Start the dev server:

  ```sh
  pnpm dev
  ```

  Open [http://localhost:5173](http://localhost:5173).

- User management CLI:

  ```sh
  # Promote a user (who has already signed in with Google) to admin
  pnpm user make-admin <email>

  # Create a passwordless placeholder user (cannot sign in — Google OAuth only)
  pnpm user create <email> --admin

  pnpm category create <slug> <name>
  ```

### Authentication

Authentication is enforced per-route via loaders. All routes **must** enforce authentication unless publicly accessible.

```typescript
export const loader: LoaderFunction = async ({ request, context }) => {
  await requireUserId(request, context);
};
```

Actions on the same route also need the check:

```typescript
export const action: ActionFunction = async ({ request, context }) => {
  await requireUserId(request, context);
};
```

All endpoints that require auth must include a test asserting that authentication is enforced.

## Testing

### Vitest

Lower-level tests use [Vitest](https://vitest.dev/) with `happy-dom` and [`@testing-library/jest-dom`](https://testing-library.com/jest-dom) for DOM assertions. DB-hitting tests run against a real Postgres instance (local or CI service container).

```sh
pnpm test
```

### Type Checking

```sh
pnpm typecheck
```

### Linting

```sh
vp lint          # check for lint errors (Oxlint)
vp lint --fix    # auto-fix where possible
```

### Formatting

```sh
vp fmt --write   # format the repo (Oxfmt, Prettier-compatible)
vp fmt --check   # verify formatting without writing
```

### All-in-one check

```sh
vp check         # fmt + lint in one pass
vp check --fix   # plus auto-fix
```

## License

See `LICENSE`. Note: Gazpacho is currently bundled in the repository and requires a commercial license. We'll fix this to make it optional in the future.
