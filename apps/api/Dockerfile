FROM node:22-alpine AS build
WORKDIR /app

COPY apps/api/package.json ./package.json
RUN npm install
COPY apps/api/nest-cli.json ./nest-cli.json
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY apps/api/package.json ./package.json
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
