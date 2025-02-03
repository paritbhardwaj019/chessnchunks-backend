FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

RUN sed -i 's/provider = "prisma-client-js"/provider = "prisma-client-js"\n  binaryTargets = ["native", "linux-musl"]/' prisma/schema.prisma

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]