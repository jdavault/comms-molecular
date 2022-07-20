FROM case.artifacts.medtronic.com/ext-docker-hub-remote/node:16-alpine as ts-compiler
#USER node
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM case.artifacts.medtronic.com/ext-docker-hub-remote/node:16-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=ts-compiler /app/package*.json ./
COPY --from=ts-compiler /app/dist ./dist
RUN npm ci --production
# Open port for Contrast Security Agent
EXPOSE 30555

USER node

# Start server
CMD ["npm", "start"]
