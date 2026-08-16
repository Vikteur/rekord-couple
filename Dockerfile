# syntax=docker/dockerfile:1
#
# Static image: build the SPA, then serve it from nginx. It talks to the API
# (Vikteur/spotify-to-rekordbox) over the same origin — the edge proxy routes
# /api there and /g/ here — so this container holds no secrets and no state.

# --- stage 1: build -------------------------------------------------------
FROM node:24-alpine AS web
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
# Point a build at an API on another origin with:
#   docker build --build-arg VITE_API_BASE=https://api.example.com .
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE
# `npm run build` = tsc --noEmit && vite build -> /build/dist
RUN npm run build

# --- stage 2: runtime -----------------------------------------------------
FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/rekord-couple.conf
# base is /guest/, so the bundle has to sit at /guest/ under the web root.
COPY --from=web /build/dist /usr/share/nginx/html/guest

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
