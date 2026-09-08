FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json ./nest-cli.json
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src
COPY .dockerignore ./
RUN npm install
WORKDIR /build/apps/api
RUN npx nest build
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-alpine
WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/apps/api/package.json ./package.json
COPY --from=build /build/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
