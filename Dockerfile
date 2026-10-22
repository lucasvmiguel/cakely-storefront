# syntax=docker/dockerfile:1

FROM node:24.22.1-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24.22.1-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24.22.1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24.22.1-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY package.json package-lock.json server.js ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "server.js"]
