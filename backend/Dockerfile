# syntax=docker/dockerfile:1

FROM node:25-alpine AS base
# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/health/ready || exit 1
# Apply pending migrations, optionally load demo data, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_DEMO_DATA\" = \"true\" ]; then node dist/scripts/seed.js; fi && exec node dist/server.js"]
