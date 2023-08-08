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

## Development

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
