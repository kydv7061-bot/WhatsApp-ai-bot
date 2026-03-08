FROM node:22-alpine

RUN apk add --no-cache git python3 make g++

WORKDIR /app
  
COPY . .

RUN npm install

CMD ["node", "index.js"]
