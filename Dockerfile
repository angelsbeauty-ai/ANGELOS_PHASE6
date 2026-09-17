FROM node:22-alpine AS build
WORKDIR /build/apps/api
COPY apps/api/package.json ./
COPY apps/api/nest-cli.json ./
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
COPY supabase/migrations ../supabase/migrations
COPY scripts/migrations ../scripts/migrations
RUN npm install --legacy-peer-deps
RUN npx nest build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /build/apps/api/node_modules ./node_modules
COPY --from=build /build/apps/api/dist ./dist
COPY --from=build /build/supabase/migrations ./supabase/migrations
COPY --from=build /build/scripts/migrations ./scripts/migrations
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
