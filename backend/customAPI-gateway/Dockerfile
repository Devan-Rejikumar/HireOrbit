# ------------------ Builder ------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all deps needed for build
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript → JavaScript
RUN npm run build


# ------------------ Runtime ------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only runtime artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 4000

CMD ["node", "dist/server.js"]
