#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install MySQL Client
sudo apt install -y mysql-client

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Print versions
echo "Installed versions:"
node -v
npm -v
nginx -v
pm2 -v

echo "Setup complete! Please clone your repo and follow the deployment steps in README."
