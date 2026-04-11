#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git

# Install Docker
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group
sudo usermod -aG docker $USER

# Install MySQL Client (Since using AWS RDS, local mysql-server is no longer needed)
sudo apt install -y mysql-client

# Print versions
echo "Installed versions:"
docker --version
git --version
mysql --version

echo "Setup complete! Please clone your repo and follow the deployment steps in README."
