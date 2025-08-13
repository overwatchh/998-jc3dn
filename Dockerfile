# ----------------------------
# 1️⃣ Build stage
# ----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better cache)
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Build the Next.js app
RUN npm run build


# ----------------------------
# 2️⃣ Production stage
# ----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Copy only the production build output & necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Start the app (Cloud Run will listen on $PORT)
CMD ["npm", "start"]
