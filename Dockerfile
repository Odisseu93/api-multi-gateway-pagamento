# ============================================================
# Stage 1 – Builder
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Build the AdonisJS application
RUN node ace build

# ============================================================
# Stage 2 – Production
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app

# Copy only the production package manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled build output from the builder stage
COPY --from=builder /app/build ./build

# Copy migrations so they can run at startup inside the container
COPY --from=builder /app/database ./database

EXPOSE 3333

# Run migrations then start the server
CMD ["sh", "-c", "node build/ace.js migration:run --force && node build/bin/server.js"]
