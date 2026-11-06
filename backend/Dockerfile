FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY scripts/sync-simulation-schema.cjs ./scripts/sync-simulation-schema.cjs
EXPOSE 3000
CMD ["sh", "-c", "node scripts/sync-simulation-schema.cjs && node dist/src/database/seeds/run-create-admin.js && node dist/src/main.js"]
