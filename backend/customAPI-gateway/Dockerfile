FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Expose port 4000 (API Gateway port)
EXPOSE 4000

# Start the application
CMD ["npm", "start"]

