# Portable API image, for any host that takes a container.
#
# The whole workspace is copied because the API imports nothing from the web app
# but npm workspaces resolve from the root; a partial copy breaks `npm ci`.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/share_ui/package.json packages/share_ui/
RUN npm ci --workspace @motor-master/api --include-workspace-root
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN npm run build --workspace @motor-master/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --workspace @motor-master/api --include-workspace-root \
 && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
# Migrations and seed data ship too, so a one-off job can run them on the host.
COPY apps/api/src/db/migrations apps/api/src/db/migrations
COPY apps/api/src/db/seed apps/api/src/db/seed
COPY apps/api/src/db/seed.sql apps/api/src/db/

# The platform supplies PORT; 4000 is only the local default.
EXPOSE 4000
USER node
CMD ["node", "apps/api/dist/server.js"]
