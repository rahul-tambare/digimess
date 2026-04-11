# Complete End-to-End Deployment Guide: Digimess

This guide covers everything from purchasing a domain to having a live, secure production application on AWS.

---

## Phase 1: Domain & AWS Infrastructure

### 1.1 Purchase Domain
*   Go to **AWS Route 53** > **Registered domains**.
*   Search for and purchase `rahultambare.click`.

### 1.2 Create EC2 Instance
*   Go to **EC2 Dashboard** > **Launch instance**.
*   **OS**: Ubuntu 22.04 LTS (64-bit).
*   **Instance type**: t2.micro (Free-tier eligible) or higher.
*   **Key pair**: Create/select your `.pem` file for SSH.
*   **Security Groups**: Allow **SSH (22)**, **HTTP (80)**, and **HTTPS (443)** from anywhere (`0.0.0.0/0`).

### 1.3 Attach Elastic IP
*   Go to **Elastic IPs** > **Allocate Elastic IP address**.
*   Select the IP > **Actions** > **Associate Elastic IP address**.
*   Select your EC2 instance. This prevents your IP from changing on reboot.

---

## Phase 2: Source Code & GitHub

### 2.1 Git Setup (Local Machine)
*   Initialize git if you haven't: `git init`.
*   Connect to GitHub: `git remote add origin git@github.com:rahul-tambare/digimess.git`.

### 2.2 SSH Keys (EC2 to GitHub)
On your EC2 terminal:
1.  Generate key: `ssh-keygen -t ed25519 -C "your-email@example.com"`.
2.  Get public key: `cat ~/.ssh/id_ed25519.pub`.
3.  Add this to **GitHub** > **Settings** > **SSH and GPG keys**.

---

## Phase 3: Server Configuration

### 3.1 Clone & Setup Script
On your EC2 terminal:
```bash
git clone git@github.com:rahul-tambare/digimess.git
cd digimess
chmod +x deployment/setup_ec2.sh
./deployment/setup_ec2.sh
```

### 3.2 MySQL Configuration
1.  Set root password:
    ```bash
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Your_DB_Password'; FLUSH PRIVILEGES;"
    ```
2.  Permissions Fix:
    ```bash
    sudo chmod 755 /home/ubuntu
    ```

---

## Phase 4: Application Deployment

### 4.1 Environment & Database Init
1.  Create `.env` in the root (`~/digimess/`):
    ```bash
    cp backend/.env.production .env
    nano .env # Set your DB_PASS and JWT_SECRET
    ```
2.  Initialize Database:
    ```bash
    cd backend && npm install && npm run db:init && cd ..
    ```

### 4.2 Start Backend (PM2)
```bash
pm2 start deployment/ecosystem.config.js
pm2 save
pm2 startup
```

### 4.3 Build Frontend, Admin, & Provider
```bash
# Admin Panel
cd admin && npm install && npm run build

# User Web App
cd ../frontend && npx expo install react-dom react-native-web && npx expo export --platform web

# Provider Web App
cd ../provider && npx expo install react-dom react-native-web && npx expo export --platform web
```

---

## Phase 5: Nginx & HTTPS

### 5.1 Nginx Setup
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/digimess
sudo ln -s /etc/nginx/sites-available/digimess /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 5.2 Configure Route 53 DNS Records
Add **A Records** for your Elastic IP:
- `rahultambare.click`
- `www.rahultambare.click`
- `admin.rahultambare.click`
- `api.rahultambare.click`
- `provider.rahultambare.click`
- `www.provider.rahultambare.click`

### 5.3 SSL (HTTPS)
```bash
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d rahultambare.click -d www.rahultambare.click -d admin.rahultambare.click -d api.rahultambare.click -d provider.rahultambare.click -d www.provider.rahultambare.click
```

---

## Phase 6: Maintenance

-   **Update Code**: `git pull origin main`.
-   **Restart API**: `pm2 restart digimess-api`.
-   **Rebuild Admin**: `cd admin && npm install && npm run build`
-   **Rebuild User Web**: `cd frontend && npx expo export --platform web`
-   **Rebuild Provider Web**: `cd provider && npx expo export --platform web`
-   **Check Logs**: `pm2 logs` or `sudo tail -f /var/log/nginx/error.log`.
