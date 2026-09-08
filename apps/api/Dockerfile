FROM node:22-alpine
WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# Copy source
COPY apps/api/src ./apps/api/src

# Install deps and build in one stage (no multi-stage complexity)
RUN npm install \
    && npm run build --workspace=@angelos/api \
    && npm install --omit=dev --workspace=@angelos/api \
    && npm cache clean --force

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
