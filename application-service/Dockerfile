FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema first (needed for client generation)
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy all source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port 3004
EXPOSE 3004

# Start the application
CMD ["npm", "run", "dev"]

