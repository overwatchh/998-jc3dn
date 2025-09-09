# ----------------------------
# 1️⃣ Build stage
# ----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm i --force


# Copy source
COPY . .

# Build the Next.js app
RUN npm run build


# ----------------------------
# 2️⃣ Production stage
# ----------------------------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3000

COPY --from=builder /app/package*.json ./ 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

CMD ["npm", "start"]
