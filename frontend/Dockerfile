FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,id=frontend-npm,target=/root/.npm npm install

COPY . .
RUN npx expo install react-dom react-native-web
RUN npx expo export --platform web

# Use modern Node.js 'serve' to serve static files
FROM node:24-alpine

WORKDIR /app
RUN npm install -g serve

# Copy build files directly for serving
COPY --from=builder /app/dist ./dist

EXPOSE 80

# Serve the 'dist' folder on Port 80, with Single-Page Application routing (-s)
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:80"]
