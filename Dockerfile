# 1️⃣ Use official Node.js image for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Pass build-time env variables from GitHub Actions
# ARG DB_HOST
# ARG DB_USER
# ARG DB_PASS
# ARG DB_NAME
# ARG BETTER_AUTH_SECRET
# ARG BETTER_AUTH_URL
# ARG GOOGLE_CLIENT_ID
# ARG GOOGLE_CLIENT_SECRET
# ARG BASE_URL

# ENV DB_HOST=$DB_HOST \
#     DB_USER=$DB_USER \
#     DB_PASS=$DB_PASS \
#     DB_NAME=$DB_NAME \
#     BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
#     BETTER_AUTH_URL=$BETTER_AUTH_URL \
#     GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
#     GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
#     BASE_URL=$BASE_URL

# Build Next.js
RUN npm run build

# 2️⃣ Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app ./

EXPOSE 8080
CMD ["npm", "start"]
