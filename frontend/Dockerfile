
# Dockerfile for React (Development)

FROM node:18-slim

WORKDIR /usr/src/app/

COPY package.json package-lock.json /usr/src/app/

RUN npm install

COPY . .

CMD ["sh", "-c", "npm run start"]
