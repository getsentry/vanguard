# Vanguard

Vanguard is an internal blog-like platform, inspired by [PlanetScale's Beam](https://github.com/planetscale/beam).

An excerpt in how we describe this at Sentry:

> Vanguard has been designed to provide a way to create permanence around
> timely internal moments at Sentry. While the core of it is a simple
> blog, it's intending to continuously enable the culture of sharing what
> we're building at Sentry. Additionally we have recognized the need to
> create more long lasting moments out of things that are top of mind,
> which we're dubbing as 'Strategy' in this context. You'll see several
> historical posts by myself of this nature.

It is built on top of [Remix](https://github.com/remix-run/remix), and intended to be deployed on private GCP infrastructure.

**Note: This project is a work in progress, and is primarily intended for Sentry use. Our hope is that we can keep it generic enough that its usable elsewhere, but that may require effort from the open source community.**

![screenshot of vanguard](/screenshot.png?raw=true)

## Deployment

While we at Sentry deploy this to GCP (using a combination of Cloud Run, Cloud Storage, and SQL), we have included the stock [blues-stack Fly config](https://github.com/remix-run/blues-stack). You will still need to configure an image storage service.

You will need to ensure a few key values are set in production:

```sh
# generate a random secret using `openssl rand -hex 32`
SESSION_SECRET=
DATABASE_URL=
```

### Google Auth

Google Auth is the primary provider, although email/password is supported for local development. To configure Google, you will need to set the following value:

```sh
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_IAP_AUDIENCE=
# preferably restrict it to your domain
GOOGLE_HD=your-google-workspace-domain.com
```

To disable email/password authentication, you can set this option:

```sh
USE_BASIC_LOGIN=false
```

### Sentry

For Sentry to work, you will also need the following defined:

```sh
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

For more details on deploying to Fly, we recommend taking a look at the guide in [blues-stack](https://github.com/remix-run/blues-stack#deployment).

### Images Hosting

To support avatars and image attachments on posts you will need to configure an image hosting service. This is done using environment variables:

```sh
USE_GCS_STORAGE=1
GCS_BUCKET_NAME=your-bucket-name
GCS_BUCKET_PATH=images
```

You can enable signed URLs for images by setting the expiration time in the `GCS_EXPIRES_IN` variable. In this case, you will have to provide a GCP service account, either with the Workload Identity (recommended), or with a static key (with the `GOOGLE_APPLICATION_CREDENTIALS` environment variable).

```sh
# 1 hour expiration time
GCS_EXPIRES_IN=3600000
```

Currently we only support Google's Cloud Storage service, but would happily take contributions to enable other services such as S3.

### Outbound Email

You'll have to figure this one out. Outbound email is used for publishing new posts, as well as receiving notifications of new comments. We suggest something like Sendgrid to make it easy.

```sh
SMTP_FROM=vanguard@example.com
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Development

- Make sure you have all required tooling:

  - [pre-commit](https://pre-commit.com/)
  - [pnpm](https://pnpm.io/)

- Bootstrap the environment:

  ```sh
  # this will copy the default config to .env
  make
  ```

- Start the Postgres Database in [Docker](https://www.docker.com/get-started):

  ```sh
  docker-compose up -d
  ```

- Initial setup:

  ```sh
  make
  ```

- Create a user (assuming you've not setup Google Auth):

  ```sh
  pnpm user create <email> <password> --admin
  ```

  - Create at least one category

  ```sh
  pnpm category create <slug> <name>
  ```

- **Optional**: Populate your database with sample data:

  ```sh
  pnpm run db:seed
  ```

  This will create:

  - A demo user (if none exists): `demo@example.com` with password `password123`
  - A sample category (if none exists): "General"
  - Three sample posts with rich content and images

  The seed script is safe to run multiple times - it won't create duplicates.

- Run the first build:

  ```sh
  pnpm build
  ```

- Start dev server:

  ```sh
  pnpm dev
  ```

### Authentication

Authentication is enforced per-route via the Remix loaders. All routes **must** enforce authentication unless they are intended to be publicly accessible.

```typescript
export const loader: LoaderFunction = async ({ request, context }) => {
  await requireUserId(request, context);
};
```

If you are also using actions on the route, you need to define the same check in the action:

```typescript
export const action: ActionFunction = async ({ request, context }) => {
  await requireUserId(request, context);
};
```

All endpoints which require auth must also contain a test asserting that authentication is enforced.

## Testing

### Vitest

For lower level tests of utilities and individual components, we use `vitest`. We have DOM-specific assertion helpers via [`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.

## License

See `LICENSE`, with an asterisk that Gazpacho is currently bundled in the repository and requires a commercial license. We'll fix this to make it optional in the future.
