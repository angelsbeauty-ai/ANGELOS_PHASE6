# AngelOS API — Railway Dockerfile (root-level)
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
RUN npm install --prefix ./apps/api
RUN npx --prefix ./apps/api nest build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
