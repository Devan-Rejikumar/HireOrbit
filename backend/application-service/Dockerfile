# ------------------ Builder ------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all deps (needed for build + prisma)
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY . .

# Build TypeScript → dist
RUN npm run build


# ------------------ Runtime ------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=docker

# Copy only runtime artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Upload directory (runtime)
RUN mkdir -p uploads

EXPOSE 3004

CMD ["node", "dist/index.js"]
