FROM node:22-alpine
WORKDIR /app
# Railway's railpack already built apps/api/dist and copied node_modules to /app
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
