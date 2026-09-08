FROM node:22-alpine
WORKDIR /app

# Install and build
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src

RUN cd /app/apps/api && npm install && npx nest build

# Railway's default CMD runs: node /app/dist/main.js
# Copy built dist to /app/dist so Railway's default CMD works
RUN cp -r /app/apps/api/dist /app/dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
