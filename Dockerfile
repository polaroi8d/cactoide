FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .

RUN npm ci

ARG PUBLIC_LANDING_INFO
ENV PUBLIC_LANDING_INFO=$PUBLIC_LANDING_INFO

ARG LOG_PRETTY
ENV LOG_PRETTY=$LOG_PRETTY

ARG LOG_LEVEL
ENV LOG_LEVEL=$LOG_LEVEL

COPY . .

RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/healthz || exit 1

EXPOSE 3000
CMD [ "node", "build" ]
