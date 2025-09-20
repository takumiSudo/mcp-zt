FROM node:18-alpine
WORKDIR /app
COPY conformance/package.json conformance/package-lock.json* ./
RUN npm install
COPY conformance/tsconfig.json ./tsconfig.json
COPY conformance/src ./src
RUN npm run build
CMD ["node", "dist/index.js", "--help"]
