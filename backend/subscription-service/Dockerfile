FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm install -g typescript ts-node

EXPOSE 3005

CMD ["npm", "start"]