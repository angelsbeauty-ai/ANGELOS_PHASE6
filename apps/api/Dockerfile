FROM node:22-alpine
# Railway's railpack already built apps/api/dist and copied node_modules to /app
# Minimal runtime image — no build stage needed, railpack handles the build
WORKDIR /app
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
