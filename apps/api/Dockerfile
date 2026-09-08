FROM node:22-alpine AS build
WORKDIR /app

# Copy workspace root files needed for monorepo install
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# Install all workspace dependencies (needed for build)
RUN npm install

# Copy API source
COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src 2>/dev/null || true

# Build the API
RUN npm run build --workspace=@angelos/api

# Runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json

# Install production dependencies only
RUN npm install --omit=dev --workspace=@angelos/api && npm cache clean --force

# Copy built output
COPY --from=build /app/apps/api/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
