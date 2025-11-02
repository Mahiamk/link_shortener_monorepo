# /apps/web/Dockerfile

# --- 1. Build Stage ---
# Use an official Node.js image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and lock file
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the Next.js app
RUN npm run build

# --- 2. Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV production

# Copy built assets from the 'builder' stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose port 3000
EXPOSE 3000

# Command to start the production server
CMD ["npm", "run", "start"]