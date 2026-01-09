# ------------------ Builder ------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Dependency manifests
COPY package.json package-lock.json ./

# Install all deps (needed to build)
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build


# ------------------ Runtime ------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only runtime artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 4007

CMD ["node", "dist/index.js"]
