# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vanguard is an internal blog-like platform built with Remix, inspired by PlanetScale's Beam. It's designed for creating permanence around timely internal moments, featuring posts, categories, comments, reactions, and feeds. The platform supports authentication via Google OAuth and basic email/password, with role-based access control.

## Key Development Commands

### Development Environment Setup

```bash
make                    # Bootstrap environment (copy .env.example to .env)
docker-compose up -d    # Start PostgreSQL database
pnpm install           # Install dependencies
pnpm build             # Initial build
pnpm dev               # Start development server
```

### Database Operations

```bash
pnpm run db:migrate     # Run database migrations
pnpm run db:seed        # Populate database with sample data
make reset-db          # Drop and recreate database
```

### User and Category Management

```bash
pnpm user create <email> <password> --admin    # Create admin user
pnpm category create <slug> <name>              # Create category
```

### Testing and Quality

```bash
pnpm test              # Run all tests (migrates test DB first)
pnpm run test:vitest   # Run vitest tests only
pnpm run typecheck     # TypeScript type checking
pnpm run lint          # ESLint checking
pnpm run lint:fix      # Fix ESLint issues
pnpm run format        # Format code with Prettier
pnpm run validate      # Run tests, lint, typecheck together
```

### Build and Production

```bash
pnpm build             # Build for production
pnpm start             # Start production server
```

## Architecture Overview

### Database Layer (Prisma)

- **Models**: User, Post, Category, PostComment, PostReaction, PostSubscription, Feed
- **Schema**: Located in `prisma/schema.prisma`
- **Migrations**: Auto-generated in `prisma/migrations/`
- **Seeding**: `prisma/seed.ts` creates demo data

### Application Structure (Remix)

- **Routes**: File-based routing in `app/routes/`
  - Admin routes: `admin.*` (categories, feeds, posts, users management)
  - API routes: `api.*` (REST endpoints for comments, reactions, subscriptions)
  - User routes: `u.$userEmail`, `p.$postId`, `c.$categorySlug`
- **Models**: Server-side data access in `app/models/`
- **Services**: Core services in `app/services/` (auth, db, session)
- **Components**: Reusable UI components in `app/components/`

### Authentication & Authorization

- Authentication enforced per-route via `requireUserId(request, context)`
- Both loaders AND actions must include auth checks
- Google OAuth + basic email/password support
- Role-based access: `admin` and `canPostRestricted` flags

### Key Libraries

- **Remix**: Full-stack React framework
- **Prisma**: Database ORM with PostgreSQL
- **Tailwind CSS**: Styling framework
- **Radix UI**: Component primitives
- **Vitest**: Testing framework
- **ESLint + Prettier**: Code quality tools

### File Upload and Storage

- Google Cloud Storage integration for images
- Upload handling in `app/lib/upload-handler.ts`
- Image routes in `image-uploads.$.tsx`

### Email and Notifications

- SMTP-based email notifications for posts and comments
- Slack webhook integration for category announcements
- Email templates and logic in `app/lib/email.ts`

## Development Notes

### Authentication Requirements

All protected routes must include auth checks in both loaders and actions:

```typescript
export const loader: LoaderFunction = async ({ request, context }) => {
  await requireUserId(request, context);
};

export const action: ActionFunction = async ({ request, context }) => {
  await requireUserId(request, context);
};
```

### Testing Requirements

- All auth-protected endpoints must have tests verifying authentication enforcement
- Use Vitest with DOM testing utilities
- Test database is automatically migrated before test runs

### Environment Setup

- Copy `.env.example` to `.env` for local development
- Requires PostgreSQL database (provided via Docker Compose)
- Google OAuth credentials needed for full functionality
