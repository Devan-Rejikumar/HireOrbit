# Use Node.js 18 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for nodemon)
RUN npm ci

# Copy Prisma schema first (needed for client generation)
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy all source code
COPY . .

# Expose port 3000 (user service port)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
