FROM node:24-bookworm-slim

# Install Chromium dependencies for Remotion
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 \
  libgbm-dev \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libxshmfence1 \
  fonts-noto-color-emoji \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./
COPY remotion.config.ts ./

# Download Chromium for Remotion and bundle the composition
RUN npx remotion browser ensure && npx remotion bundle --public-dir=public

EXPOSE 8080

CMD ["node", "--experimental-strip-types", "src/server.ts"]
