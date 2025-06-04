# Stage 1: Building the code
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build application
RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 