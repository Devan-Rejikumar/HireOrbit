# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose port 5173 (Vite dev server port)
EXPOSE 5173

# Start the React development server
CMD ["npm", "run", "dev"]
