FROM node:18-alpine
WORKDIR /app
COPY admin-ui/package.json admin-ui/package-lock.json* ./
RUN npm install
COPY admin-ui/tsconfig.json ./
COPY admin-ui/vite.config.ts ./vite.config.ts
COPY admin-ui/tailwind.config.js ./
COPY admin-ui/postcss.config.js ./
COPY admin-ui/index.html ./
COPY admin-ui/src ./src
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
