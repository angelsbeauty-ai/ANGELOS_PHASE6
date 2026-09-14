# AngelOS API — Railway Dockerfile (root-level)
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
COPY apps/api/package.json ./package.json
COPY apps/api/nest-cli.json ./nest-cli.json
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src
COPY supabase/migrations ./supabase/migrations
COPY scripts/migrations ./scripts/migrations
RUN npm install
RUN npx nest build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY --from=build /build/supabase/migrations ./supabase/migrations
COPY --from=build /build/scripts/migrations ./scripts/migrations
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
