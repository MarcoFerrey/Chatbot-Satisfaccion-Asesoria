# ---------- etapa builder ----------
FROM node:21-alpine3.18 AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package*.json *-lock.yaml ./
RUN pnpm install                                   \
    && apk add --no-cache git make g++ python3     \
    && pnpm build || true                          \
    && apk del git make g++ python3                \
    && rm -rf /root/.cache /tmp/*

COPY . .

# ---------- etapa deploy ----------
FROM node:21-alpine3.18 AS deploy
WORKDIR /app

# ➊ instala Chromium + dependencias mínimas
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ttf-freefont \
      && addgroup -g 1001 -S nodejs \
      && adduser -S -u 1001 nodejs

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

# copias artefactos del builder
COPY --from=builder /app .

# ➋ instala solo prod deps (con scripts para que otras libs no fallen)
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --prod \
    && rm -rf /root/.npm /root/.pnpm-store

EXPOSE ${PORT:-3008}
CMD ["node", "src/app.js"]
