# base node image
FROM node:16-alpine as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /app

ADD package.json package-lock.json ./
RUN npm install --production=false

# Setup production node_modules
# FROM base as production-deps

# WORKDIR /app

# COPY --from=deps /app/node_modules /app/node_modules
# ADD package.json package-lock.json ./
# RUN npm prune --production

# Build the app
FROM base as build

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
# FROM base
FROM build

WORKDIR /app

# COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules /app/node_modules
# COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
ADD . .

ENV PORT 3000

EXPOSE 3000

CMD ["npm", "start"]
