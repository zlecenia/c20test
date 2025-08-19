FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci || npm install --only=production
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
