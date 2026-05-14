FROM node:22-alpine AS base
WORKDIR /app

# Keep telemetry disabled in containerized workflows.
ENV ASTRO_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
RUN npm install tsconfig-paths@^4.2.0 --no-save

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Ensure TypeScript path aliases from tsconfig.json are registered at runtime.
ENV NODE_OPTIONS="-r tsconfig-paths/register"

# Copy built output and runtime files.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

# Start app (schema sync is handled during DB initialization).
CMD ["npx", "tsx", "server.mjs"]
