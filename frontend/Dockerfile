FROM node:23.7.0-alpine3.21
WORKDIR /app
COPY ./package*.json .
RUN npm install --production
COPY . .

CMD ["npm", "run", "start"]
