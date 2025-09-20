FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY server.js ./server.js
CMD ["npm", "start"]
