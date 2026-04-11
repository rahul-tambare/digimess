FROM node:24-alpine

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install only production dependencies
RUN --mount=type=cache,id=backend-npm,target=/root/.npm npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose port (adjust if necessary, backend usually 5000)
EXPOSE 5000

# Start server
CMD ["npm", "start"]
