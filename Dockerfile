FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies required for build & tsx)
RUN npm ci

# Copy full application code
COPY . .

# Generate Prisma client and build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npx prisma generate
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Copy and set entrypoint script
RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]
