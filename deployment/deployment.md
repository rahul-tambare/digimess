# Digimess Deployment Documentation

This document serves as a permanent reference for the Digimess deployment architecture on AWS EC2.

## Infrastructure Overview

- **Server**: AWS EC2 (Ubuntu 22.04 LTS)
- **Domain**: `rahultambare.click`
- **Subdomains**:
  - `api.rahultambare.click` (Backend API)
  - `admin.rahultambare.click` (Admin Panel)
  - `provider.rahultambare.click` (Provider Web Application)
  - `rahultambare.click` (User Web Application)
- **Database**: MySQL (Local)
- **Cache**: Redis (Local)
- **Process Management**: PM2
- **Web Server**: Nginx (Reverse Proxy)

## File Structure for Deployment

```text
/home/ubuntu/digimess/
├── .env                  # Main production environment variables
├── backend/              # Node.js Express server
├── admin/dist/           # Built Admin static files (Vite)
├── provider/dist/        # Built Provider Web static files (Expo)
├── frontend/dist/        # Built User Web static files (Expo)
└── deployment/           # Nginx and PM2 configurations
```

## Quick Deployment Commands

Run these commands in order on a fresh EC2 instance:

### 1. System Setup & Clone
```bash
# Clone the repository (Requires SSH key setup on GitHub)
git clone git@github.com:rahul-tambare/digimess.git
cd digimess

# Run setup script (Installs Node, Nginx, PM2, MySQL, Redis)
chmod +x deployment/setup_ec2.sh
./deployment/setup_ec2.sh
```

### 2. Database & Environment
```bash
# Set MySQL Root Password
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Your_DB_Password'; FLUSH PRIVILEGES;"

# Create Production .env
cp backend/.env.production .env
nano .env # Set JWT_SECRET, DB_PASS, etc.

# Initialize Database Schema
cd backend && npm run db:init && cd ..
```

### 3. Build & Launch
```bash
# Fix Permissions for Nginx
sudo chmod 755 /home/ubuntu

# Start Backend API
pm2 start deployment/ecosystem.config.js

# Build Admin Panel
cd admin && npm install && npm run build

# Build User Web App
cd ../frontend && npx expo install react-dom react-native-web && npx expo export --platform web

# Build Provider Web App
cd ../provider && npx expo install react-dom react-native-web && npx expo export --platform web
```

### 4. Nginx & SSL
```bash
# Apply Nginx Config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/digimess
sudo ln -s /etc/nginx/sites-available/digimess /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Enable HTTPS (SSL)
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d rahultambare.click -d www.rahultambare.click -d admin.rahultambare.click -d api.rahultambare.click -d provider.rahultambare.click -d www.provider.rahultambare.click
```

## Maintenance Commands

- **Update Code**: `git pull origin main`
- **Restart API**: `pm2 restart digimess-api`
- **Rebuild Admin**: `cd admin && npm run build`
- **Rebuild User Web**: `cd frontend && npx expo export --platform web`
- **Rebuild Provider Web**: `cd provider && npx expo export --platform web`
- **Check Logs**: `pm2 logs` or `sudo tail -f /var/log/nginx/error.log`
