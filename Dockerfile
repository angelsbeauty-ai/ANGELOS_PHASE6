# AngelOS API — Railway Dockerfile (root-level)
# Cache-bust: change this value to force rebuild
ARG CACHE_BUST=2

FROM node:22-alpine3.193.19 AS build
WORKDIR /build/apps/api
COPY apps/api/package.json ./
COPY apps/api/nest-cli.json ./
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
COPY supabase/migrations ../supabase/migrations
COPY scripts/migrations ../scripts/migrations

# Diagnostic: show what we're working with
RUN echo "=== Build context files ===" && ls -la && echo "" && \
    echo "=== package.json ===" && cat package.json && echo "" && \
    echo "=== Installing dependencies ==="

RUN npm install --legacy-peer-deps

# Diagnostic: verify install + build
RUN echo "=== node_modules top-level packages ===" && ls node_modules | wc -l && \
    echo "=== Key packages ===" && \
    ls node_modules/@nestjs/common/package.json >/dev/null 2>&1 && echo "  @nestjs/common: OK" || echo "  @nestjs/common: MISSING" && \
    ls node_modules/@nestjs/config/package.json >/dev/null 2>&1 && echo "  @nestjs/config: OK" || echo "  @nestjs/config: MISSING" && \
    ls node_modules/@supabase/supabase-js/package.json >/dev/null 2>&1 && echo "  @supabase/supabase-js: OK" || echo "  @supabase/supabase-js: MISSING" && \
    ls node_modules/livekit-server-sdk/package.json >/dev/null 2>&1 && echo "  livekit-server-sdk: OK" || echo "  livekit-server-sdk: MISSING"

RUN echo "=== Building ===" && npx nest build && \
    echo "=== Build output ===" && ls -la dist/ && \
    echo "=== dist/main.js ===" && ls -la dist/main.js

FROM node:22-alpine3.19
WORKDIR /app
COPY --from=build /build/apps/api/node_modules ./node_modules
COPY --from=build /build/apps/api/dist ./dist
COPY --from=build /build/supabase/migrations ./supabase/migrations
COPY --from=build /build/scripts/migrations ./scripts/migrations

# Diagnostic: verify runtime image
RUN echo "=== Runtime image verification ===" && \
    echo "node_modules:" && ls node_modules/@nestjs/common/package.json >/dev/null 2>&1 && echo "  @nestjs/common: OK" || echo "  @nestjs/common: MISSING" && \
    ls node_modules/@supabase/supabase-js/package.json >/dev/null 2>&1 && echo "  @supabase/supabase-js: OK" || echo "  @supabase/supabase-js: MISSING" && \
    echo "dist:" && ls dist/main.js >/dev/null 2>&1 && echo "  dist/main.js: OK" || echo "  dist/main.js: MISSING"

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
