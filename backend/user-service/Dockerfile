FROM node:20

WORKDIR /app

# Optional but consistent with your friend
RUN npm install -g npm@11.6.0

# Copy root package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything
COPY . .

# Prisma client generation (needed at runtime)
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start"]
