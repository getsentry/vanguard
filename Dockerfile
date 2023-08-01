FROM node:18-alpine as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

RUN npm install -g pnpm

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /app

ADD package.json pnpm-lock.yaml .
RUN pnpm install

# Setup production node_modules
FROM base as production-deps

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
ADD package.json package-lock.json ./

# XXX: some issues with using db seed which is considered dev, so give up on this optimization
# RUN npm prune --production

# Build the app
FROM base as build

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

ADD prisma .
RUN npx prisma generate

ADD . .
RUN pnpm run build

# Finally, build the production image with minimal footprint
FROM base
FROM build as runner

WORKDIR /app

COPY --from=production-deps /app/node_modules ./node_modules
# COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
ADD . .

ENV PORT 3000

EXPOSE 3000

CMD ["pnpm", "start"]
