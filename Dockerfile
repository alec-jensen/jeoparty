FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

# Copy built output and runtime files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src ./src

# Configuration — override these in docker-compose.yml or with -e flags
ENV DATABASE_URL=mysql://jeoparty:jeoparty@db:3306/jeoparty
ENV JWT_SECRET=change-me-in-production
ENV PORT=3000
# ENV DISABLE_REGISTRATION=true

EXPOSE 3000

# Push schema then start app
CMD ["sh", "-c", "npx drizzle-kit push && npx tsx server.mjs"]
