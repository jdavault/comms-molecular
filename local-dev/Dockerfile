FROM node:16-alpine AS base
# Working directory
WORKDIR /app
# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

FROM base AS app
# Copy source
COPY . .

# Copy self-signed certs
COPY ./local-dev/self-signed-server.crt .
COPY ./local-dev/self-signed-server.key .

# Build and cleanup
ENV NODE_ENV=development
RUN npm run build \
 && npm prune

# Start server for local dev
CMD ["npm", "run", "start:dev"]
