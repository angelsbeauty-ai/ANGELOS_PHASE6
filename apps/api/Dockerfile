FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src

RUN cd /app/apps/api && npm install && npx nest build

# Railway's default CMD: node /app/dist/main.js
# Ensure /app/dist/main.js exists
RUN cp -r /app/apps/api/dist /app/dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
