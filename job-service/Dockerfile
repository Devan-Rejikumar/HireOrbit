
FROM node:20-alpine


WORKDIR /app


COPY package*.json ./


RUN npm ci


COPY prisma ./prisma/


RUN npx prisma generate


COPY . .


EXPOSE 3002


CMD ["npm", "run", "dev"]
