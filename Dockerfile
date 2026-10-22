# syntax=docker/dockerfile:1
#
# Production image for BOLT XR Wallet.
#
# next.config.ts sets `output: 'export'`, so the build emits a static site in
# `out/` — there is no Node server to run. nginx serves it, which keeps the image
# small and needs nothing but HTTPS in front (camera/WebXR require a secure
# context, provided by Traefik).
#
# `pnpm build` runs scripts/copy-vendor-assets.mjs first, which copies the
# MediaPipe Hands runtime + model from node_modules into public/vendor/ so hand
# tracking is same-origin. That is why node_modules must exist before the build
# and why the export is the only build output we ship.

FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
WORKDIR /app

# --ignore-scripts keeps electron's ~100 MB binary download out of the image;
# nothing in the Next build needs a postinstall to have run.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

FROM nginx:1.27-alpine AS runner
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
