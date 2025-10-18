# Docker Deployment for Constructify

This directory contains a complete Docker setup for deploying the Constructify application to AWS EC2 or any Docker-compatible environment.

## 📦 What's Included

### Docker Configuration Files
- ✅ `backend/Dockerfile` - PHP/Laravel container configuration
- ✅ `frontend/Dockerfile` - React/Nginx container configuration  
- ✅ `docker-compose.yml` - Multi-container orchestration
- ✅ `nginx/backend.conf` - Nginx configuration for Laravel API
- ✅ `frontend/nginx.conf` - Nginx configuration for React app
- ✅ `.dockerignore` - Files excluded from Docker builds

### Deployment Scripts
- ✅ `deploy-ec2.sh` - Automated deployment script
- ✅ `setup-ec2.sh` - EC2 instance initial setup script

### Configuration Templates
- ✅ `env.docker.example` - Docker Compose environment template
- ✅ `backend/.env.production` - Laravel production environment template

### Documentation
- ✅ `AWS_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide (50+ pages)
- ✅ `DOCKER_DEPLOYMENT_QUICKSTART.md` - Quick start guide (3 pages)
- ✅ `DOCKER_README.md` - This file

## 🚀 Quick Start

### For Local Development with Docker

```bash
# 1. Copy environment file
cp env.docker.example .env

# 2. Configure backend
cd backend
cp .env.production .env
php artisan key:generate
cd ..

# 3. Start containers
docker-compose up -d

# 4. Run migrations
docker-compose exec backend php artisan migrate

# 5. Access application
# Frontend: http://localhost
# Backend: http://localhost:8000
```

### For AWS EC2 Deployment

See **DOCKER_DEPLOYMENT_QUICKSTART.md** for step-by-step instructions.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client                        │
│              (Web Browser)                      │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│           Frontend Container (Port 80)          │
│  ┌──────────────────────────────────────────┐  │
│  │  Nginx → Serves React Build Files        │  │
│  │  Proxies /api requests to backend        │  │
│  └──────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────┘
             │
             ↓ (API Requests)
┌─────────────────────────────────────────────────┐
│      Backend Webserver Container (Port 8000)    │
│  ┌──────────────────────────────────────────┐  │
│  │  Nginx → Routes to PHP-FPM               │  │
│  └──────────┬───────────────────────────────┘  │
└─────────────┼───────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│       Backend PHP Container (Port 9000)         │
│  ┌──────────────────────────────────────────┐  │
│  │  PHP-FPM 8.2 → Laravel Application       │  │
│  └──────────┬───────────────────────────────┘  │
└─────────────┼───────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│       Database Container (Port 3306)            │
│  ┌──────────────────────────────────────────┐  │
│  │  MySQL 8.0 → Application Database        │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 📋 Container Details

### Frontend Container
- **Base Image**: node:18-alpine (build), nginx:alpine (runtime)
- **Exposed Port**: 80, 443
- **Purpose**: Serves React application and proxies API requests
- **Build Type**: Multi-stage (optimized production build)

### Backend PHP Container
- **Base Image**: php:8.2-fpm
- **Exposed Port**: 9000
- **Purpose**: Runs Laravel application via PHP-FPM
- **Extensions**: pdo_mysql, pdo_sqlite, mbstring, gd, zip, bcmath

### Backend Webserver Container
- **Base Image**: nginx:alpine
- **Exposed Port**: 8000
- **Purpose**: Routes HTTP requests to PHP-FPM
- **Features**: FastCGI proxy, security headers, large file uploads

### Database Container
- **Base Image**: mysql:8.0
- **Exposed Port**: 3306 (internal only)
- **Purpose**: Application database
- **Persistence**: Named volume `mysql_data`

## 🔧 Configuration

### Environment Variables

**Root `.env` (Docker Compose)**
```bash
APP_URL=http://your-domain.com
DB_DATABASE=constructify
DB_USERNAME=constructify_user
DB_PASSWORD=secure_password_here
```

**Backend `.env` (Laravel)**
```bash
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
DB_CONNECTION=mysql
DB_HOST=database
DB_PORT=3306
```

## 🛠️ Common Commands

### Container Management
```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# Restart containers
docker-compose restart

# View running containers
docker-compose ps

# Rebuild containers
docker-compose build --no-cache
```

### Logs & Debugging
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

### Laravel Commands
```bash
# Run artisan commands
docker-compose exec backend php artisan [command]

# Examples:
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan key:generate
```

### Database Operations
```bash
# Access MySQL shell
docker-compose exec database mysql -u root -p

# Backup database
docker-compose exec database mysqldump -u root -p constructify > backup.sql

# Restore database
docker-compose exec -T database mysql -u root -p constructify < backup.sql
```

### Shell Access
```bash
# Access backend container shell
docker-compose exec backend bash

# Access frontend container shell  
docker-compose exec frontend sh

# Access database container shell
docker-compose exec database bash
```

## 🔐 Security Considerations

### Before Deployment
- [ ] Change all default passwords
- [ ] Generate new Laravel APP_KEY
- [ ] Configure firewall rules
- [ ] Set APP_DEBUG=false in production
- [ ] Review .dockerignore to exclude sensitive files
- [ ] Enable HTTPS/SSL
- [ ] Restrict database port access
- [ ] Use secrets management for production

### AWS-Specific
- [ ] Configure security groups properly
- [ ] Enable MFA on AWS account
- [ ] Use IAM roles with minimal permissions
- [ ] Enable CloudWatch monitoring
- [ ] Configure backup strategy
- [ ] Set up CloudTrail for audit logging

## 📊 Resource Requirements

### Minimum (Development)
- **CPU**: 2 vCPU
- **RAM**: 2 GB
- **Disk**: 10 GB
- **Instance**: t2.small

### Recommended (Production)
- **CPU**: 2-4 vCPU
- **RAM**: 4-8 GB
- **Disk**: 30+ GB
- **Instance**: t2.medium or t3.medium

### High Traffic (Production)
- **CPU**: 4-8 vCPU
- **RAM**: 8-16 GB
- **Disk**: 50+ GB
- **Instance**: t3.large or m5.large

## 🚨 Troubleshooting

### Containers Won't Start
```bash
# Check Docker service
sudo systemctl status docker

# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

### Database Connection Errors
```bash
# Wait for database to be ready
docker-compose exec backend php artisan migrate

# Clear config cache
docker-compose exec backend php artisan config:clear

# Restart backend
docker-compose restart backend
```

### Permission Errors
```bash
# Fix storage permissions
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 775 /var/www/html/storage
```

### Port Conflicts
```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :8000

# Change ports in docker-compose.yml if needed
ports:
  - "8080:80"  # Use 8080 instead of 80
```

## 📈 Performance Optimization

### Laravel Optimization
```bash
# Cache configuration
docker-compose exec backend php artisan config:cache

# Cache routes
docker-compose exec backend php artisan route:cache

# Cache views
docker-compose exec backend php artisan view:cache

# Optimize autoloader
docker-compose exec backend composer install --optimize-autoloader --no-dev
```

### Database Optimization
- Enable query caching
- Add appropriate indexes
- Use connection pooling
- Regular maintenance (OPTIMIZE TABLE)

### Docker Optimization
- Use multi-stage builds (already implemented)
- Minimize layers in Dockerfiles
- Use .dockerignore effectively
- Implement health checks
- Use volumes for persistent data

## 🔄 Updates & Maintenance

### Application Updates
```bash
# 1. Pull latest code
git pull

# 2. Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. Run migrations
docker-compose exec backend php artisan migrate --force

# 4. Clear caches
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:cache
```

### System Updates
```bash
# Update Docker images
docker-compose pull

# Update Ubuntu packages
sudo apt-get update && sudo apt-get upgrade -y

# Restart containers
docker-compose restart
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 📝 Files Summary

| File | Purpose |
|------|---------|
| `Dockerfile` (backend) | Laravel PHP-FPM container |
| `Dockerfile` (frontend) | React Nginx container |
| `docker-compose.yml` | Orchestrates all containers |
| `nginx/backend.conf` | Laravel web server config |
| `frontend/nginx.conf` | React web server config |
| `.dockerignore` | Excludes unnecessary files |
| `deploy-ec2.sh` | Deployment automation |
| `setup-ec2.sh` | Server setup automation |
| `env.docker.example` | Environment template |

## 💡 Tips

1. **Always test locally first** using `docker-compose up`
2. **Use named volumes** for data persistence
3. **Monitor resource usage** with `docker stats`
4. **Implement health checks** for auto-recovery
5. **Use Docker networks** for container isolation
6. **Regular backups** are essential
7. **Keep images updated** for security patches
8. **Use environment variables** for configuration
9. **Implement logging** properly
10. **Test disaster recovery** procedures

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Review this README and deployment guides
3. Check Docker and Laravel documentation
4. Verify all environment variables are set
5. Ensure adequate system resources
6. Check firewall and security group settings

## 📞 Support

For application-specific issues, refer to:
- `AWS_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `DOCKER_DEPLOYMENT_QUICKSTART.md` - Quick reference
- Application documentation in other README files

---

**Last Updated**: 2025-10-18  
**Version**: 1.0.0  
**Tested On**: Ubuntu 20.04 LTS, Docker 24.0+, Docker Compose 2.0+

