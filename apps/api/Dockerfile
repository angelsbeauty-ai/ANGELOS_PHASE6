FROM node:22-alpine
WORKDIR /app

# Install dependencies and build the API from source
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src

RUN cd /app/apps/api && npm install && npx nest build

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
