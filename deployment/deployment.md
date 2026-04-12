# Digimess Deployment Documentation (Docker + Traefik)

This document serves as a permanent reference for the Digimess deployment architecture on AWS EC2 using Docker & Traefik.

## Infrastructure Overview

- **Server**: AWS EC2
- **Domain**: `rahultambare.click`
- **Subdomains**:
  - `api.rahultambare.click` (Backend API)
  - `admin.rahultambare.click` (Admin Panel)
  - `provider.rahultambare.click` (Provider Web Application)
  - `rahultambare.click` (User Web Application)
- **Database**: MySQL (AWS RDS)
- **Cache**: Redis (Dockerized)
- **Reverse Proxy / SSL**: Traefik (Dockerized)

## File Structure for Deployment

```text
/home/ubuntu/digimess/
├── .env                  # Main production environment variables
├── docker-compose.yml    # Orchestrates Traefik, Apps, Redis
├── backend/              # Node.js Express server + Dockerfile
├── admin/                # Admin app + Dockerfile
├── provider/             # Provider app + Dockerfile
├── frontend/             # User app + Dockerfile
└── letsencrypt/          # Directory to store acme.json certificates
```

## Quick Deployment Commands

Run these commands in order on a fresh machine (ensure Docker is installed):

### 1. System Setup & Clone
```bash
# Clone the repository
git clone git@github.com:rahul-tambare/digimess.git
cd digimess

# Ensure Docker & Docker Compose are installed
sudo apt-get update && sudo apt-get install docker.io docker-compose-v2 -y
```

### 2. Prepare Environment
```bash
# Create Production .env
cp backend/.env.production .env
nano .env # Set JWT_SECRET, DB_PASS, frontend URLs etc.

# Prepare Let's Encrypt storage for Traefik
mkdir -p letsencrypt
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json
```

### 3. Build & Launch
```bash
# Build and start all containers in detached mode
sudo docker compose up -d --build

# Make sure your backend `.env` has the correct RDS host and credentials set.
```

### 4. Database Setup
```bash
# Enter the backend container to run database migrations/initialization
sudo docker compose exec backend npm run db:init
```

## Maintenance Commands

- **Update Code**: `git pull origin main`
- **Apply Updates**: `sudo docker compose up -d --build` (Automatically builds and restarts updated instances only)
- **Check Traffic / Logs**: `sudo docker compose logs -f traefik`
- **Check Backend Logs**: `sudo docker compose logs -f backend`
- **Restart Backend**: `sudo docker compose restart backend`
- **Stop All**: `sudo docker compose down`

## Backup

Regularly backup your `.env` file and `letsencrypt/acme.json` file.
For Redis, the data volume (`redis_data`) persists locally. Please ensure you configure automated backups for your database directly from your AWS RDS Console.

## Troubleshooting Common Issues

### 1. ERR_CONNECTION_REFUSED (Nginx Port Collision)
If you previously used Nginx, it might still be running in the background and monopolizing Ports 80 and 443, preventing Traefik from binding them.
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo docker compose restart traefik
```

### 2. HTTPS Broken ("Not Secure")
If your browser says the SSL cert is invalid (self-signed), Let's Encrypt likely rejected the `acme.json` file due to improper permissions. Let's Encrypt strictly demands that only the owner can read/write this file.
```bash
sudo chmod 600 letsencrypt/acme.json
sudo docker compose restart traefik
```

### 3. DNS Traffic Hitting an ELB instead of EC2
If you ever migrate to a new EC2 instance, ensure your AWS Route 53 `A Records` strictly point to the **Raw EC2 Public IPv4 Address**. If you see `awselb/2.0` headers when curled from terminal, you accidentally turned on "Alias" and pointed the record to an old Application Load Balancer instead of the naked EC2 instance.
