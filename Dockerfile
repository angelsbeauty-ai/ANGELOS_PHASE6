# AngelOS API — Railway Dockerfile (root-level)
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY supabase/migrations ./supabase/migrations
COPY scripts/migrations ./scripts/migrations
ENV npm_config_ignore_workspaces=true
RUN npm install --prefix ./apps/api
WORKDIR /build/apps/api
RUN npx --prefix . nest build

FROM node:22-alpine
WORKDIR /app
# npm install --prefix ./apps/api places modules under /build/apps/api/node_modules
COPY --from=build /build/apps/api/node_modules ./node_modules
COPY --from=build /build/apps/api/dist ./dist
COPY --from=build /build/supabase/migrations ./supabase/migrations
COPY --from=build /build/scripts/migrations ./scripts/migrations
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
