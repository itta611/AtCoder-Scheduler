FROM node:alpine AS builder
WORKDIR /app
COPY . .
RUN npm install

FROM node:alpine
WORKDIR /app
COPY --from=builder /app .
ARG TOKEN
ENV TOKEN=${TOKEN}
RUN npm install --production
CMD ["npm", "start"]