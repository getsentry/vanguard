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

## Development

- Start the Postgres Database in [Docker](https://www.docker.com/get-started):

  ```sh
  npm run docker
  ```

  > **Note:** The npm script will complete while Docker sets up the container in the background. Ensure that Docker has finished and your container is running before proceeding.

- Initial setup:

  ```sh
  npm run setup
  ```

- Run the first build:

  ```sh
  npm run build
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

## Testing

### Vitest

For lower level tests of utilities and individual components, we use `vitest`. We have DOM-specific assertion helpers via [`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.
