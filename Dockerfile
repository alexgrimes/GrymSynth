# Base Node.js image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Build the application
FROM dependencies AS build
COPY . .
RUN pnpm run build

# Production image
FROM base AS production
ENV NODE_ENV=production

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --prod

# Copy necessary files for running the application
COPY --from=build /app/examples ./examples
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/public ./public

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js

# Command to run the application
CMD ["node", "dist/index.js"]
