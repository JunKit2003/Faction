# syntax=docker/dockerfile:1
# Faction Bikeworks website: one image serves the site, admin panel, API and uploads.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY web/package.json web/
# Behind a TLS-inspecting proxy? Pass its CA bundle: docker build --secret id=ca,src=/path/to/ca.crt .
RUN --mount=type=secret,id=ca,required=false NODE_EXTRA_CA_CERTS=/run/secrets/ca npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/data/uploads
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/seed ./server/seed
COPY --from=build /app/web/dist ./web/dist
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
VOLUME /data/uploads
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "server/dist/main.js"]
