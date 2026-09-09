# ── Stage 1: Build ──────────────────────────────────────────────────────────
# Builds both the React frontend (via Vite) and the Express server (via esbuild)
# Output: dist/          → React static assets (index.html, JS, CSS, etc.)
#         dist/server.cjs → Bundled Express server for production
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy the full source code
COPY . .

# Run the unified build:
#   - vite build         → compiles React app → dist/
#   - esbuild server.ts  → bundles Express server → dist/server.cjs
RUN npm run build

# ── Stage 2: Production Runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the full dist/ output from the builder stage:
#   dist/             → React static assets (served by Express in production)
#   dist/server.cjs   → The Express server binary
COPY --from=builder /app/dist ./dist

# Render injects PORT automatically; default to 3000 for local Docker runs
EXPOSE 3000

# Start the Express server which serves both the API and the React frontend
CMD ["node", "dist/server.cjs"]
