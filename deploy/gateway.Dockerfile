FROM node:18-alpine
WORKDIR /app
COPY gateway/package.json gateway/package-lock.json* ./
RUN npm install
COPY gateway/tsconfig.json ./tsconfig.json
COPY gateway/src ./src
RUN npm run build
RUN npm prune --production
CMD ["node", "dist/index.js"]
