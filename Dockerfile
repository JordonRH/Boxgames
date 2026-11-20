FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig*.json vite.config.ts index.html ./
COPY client ./client
COPY public ./public
COPY server ./server
COPY shared ./shared
COPY tests ./tests
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim AS runtime
ARG APP_REVISION=local
ENV NODE_ENV=production PORT=3000 APP_REVISION=$APP_REVISION
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/server/index.js"]
