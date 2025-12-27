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

# Copy source code
COPY . .

# Build TypeScript → JS
RUN npm run build


# ------------------ Runtime ------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only runtime artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 3001

CMD ["node", "dist/server.js"]
