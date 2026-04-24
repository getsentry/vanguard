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

Google Auth is the primary provider, although email/password is supported for local development. To configure Google, set the following values:

```sh
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Restrict login to your Google Workspace domain
GOOGLE_HD=your-google-workspace-domain.com
```

To disable email/password authentication:

```sh
USE_BASIC_LOGIN=false
```

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
  - Node 20.x

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

  - A demo user: `demo@example.com` / `password123`
  - A sample "General" category
  - Three sample posts

  The seed script is safe to run multiple times — it won't create duplicates.

- Start the dev server:

  ```sh
  pnpm dev
  ```

  Open [http://localhost:5173](http://localhost:5173).

- Create a user (if not using Google Auth or the seed):

  ```sh
  pnpm user create <email> <password> --admin
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
pnpm lint
pnpm lint:fix
```

### Formatting

```sh
pnpm format
```

## License

See `LICENSE`. Note: Gazpacho is currently bundled in the repository and requires a commercial license. We'll fix this to make it optional in the future.
