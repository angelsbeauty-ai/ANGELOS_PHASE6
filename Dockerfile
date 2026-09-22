FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
COPY apps/api/node_modules ./node_modules
COPY supabase/migrations ./supabase/migrations
COPY scripts/migrations ./scripts/migrations
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
