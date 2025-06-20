FROM node:21 as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

RUN npm install -g pnpm@10.4.1

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /app

ADD package.json pnpm-lock.yaml ./
ADD prisma ./prisma
RUN pnpm install

# Setup production node_modules
FROM base as production-deps

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
ADD package.json pnpm-lock.yaml ./

# XXX: some issues with using db seed which is considered dev, so give up on this optimization
# RUN npm prune --production

# Build the app
FROM base

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

ARG VERSION
ENV VERSION $VERSION

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN

ARG SENTRY_ORG
ENV SENTRY_PROJECT $SENTRY_ORG

ARG SENTRY_PROJECT
ENV SENTRY_PROJECT $SENTRY_PROJECT

ADD . .
RUN NODE_ENV=development pnpm build
RUN pnpm exec prisma generate

ENV PORT 3000

EXPOSE 3000

CMD ["pnpm", "start"]
