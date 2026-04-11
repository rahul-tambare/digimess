FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Provider pkg uses react 19, there might be peer deps issues, handle gracefully
RUN --mount=type=cache,id=provider-npm,target=/root/.npm npm install || npm install --legacy-peer-deps

COPY . .
RUN npx expo install react-dom react-native-web
RUN npx expo export --platform web

# Use Nginx to serve the static files
FROM nginx:alpine

# Configure Nginx for SPA routing
RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

RUN mkdir -p /tmp/dist-placeholder

COPY --from=builder /app/dist* /tmp/dist-placeholder/
COPY --from=builder /app/web-build* /tmp/dist-placeholder/
RUN cp -a /tmp/dist-placeholder/. /usr/share/nginx/html || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
