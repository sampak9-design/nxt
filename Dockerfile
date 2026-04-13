FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm cache clean --force && npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
