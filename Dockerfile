FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY server.js index.html ./
COPY assets ./assets
COPY posts ./posts
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "server.js"]
