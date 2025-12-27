# ------------------ Builder ------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Deterministic install
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

ENV NODE_ENV=production

EXPOSE 4005

CMD ["node", "dist/index.js"]
