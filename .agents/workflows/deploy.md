---
description: Build and deploy the full stack with Docker Compose
---

# Deploy Digimess

1. Build and start all containers:
```bash
cd /home/rahul/Desktop/digimess && docker compose up --build -d
```

2. Check all services are running:
```bash
cd /home/rahul/Desktop/digimess && docker compose ps
```

3. View logs if needed:
```bash
cd /home/rahul/Desktop/digimess && docker compose logs -f --tail=50
```

## For Local Development

Use the local compose file instead:
```bash
cd /home/rahul/Desktop/digimess && docker compose -f docker-compose.local.yml up --build -d
```
