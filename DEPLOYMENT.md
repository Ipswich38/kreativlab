# KreativLab Deployment Guide

## 🚀 GitHub Setup

### 1. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it `kreativlab` or `kreativsaas`
3. Make it public (or private if preferred)
4. Don't initialize with README (we already have one)

### 2. Push to GitHub

Run these commands in your terminal:

```bash
# Add GitHub remote (replace with your username/repo)
git remote add origin https://github.com/YOUR_USERNAME/kreativlab.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Vercel Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy the project
vercel --prod
```

### 3. Set Environment Variables in Vercel

In your Vercel dashboard, go to your project settings and add these environment variables:

#### Required Environment Variables:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"

# Redis (optional for production start)
REDIS_URL="your-redis-connection-string"

# Production Settings
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

#### Optional Environment Variables:

```env
# Email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="kreativlab-agents"
AWS_REGION="us-east-1"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

### 4. Database Setup

#### Option A: Using Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Create a new Postgres database
4. Copy the connection string to your `DATABASE_URL` environment variable

#### Option B: External Database

Use any PostgreSQL provider like:
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [PlanetScale](https://planetscale.com)
- [Railway](https://railway.app)

### 5. Run Database Migrations

After setting up your database, run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## 🔐 GitHub Secrets Setup

For CI/CD to work, add these secrets to your GitHub repository:

Go to: Repository → Settings → Secrets and variables → Actions

### Required Secrets:

```
VERCEL_TOKEN="your-vercel-token"
VERCEL_ORG_ID="your-vercel-org-id"
VERCEL_PROJECT_ID="your-vercel-project-id"
```

### Optional Secrets (for Docker builds):

```
DOCKER_USERNAME="your-docker-hub-username"
DOCKER_PASSWORD="your-docker-hub-password"
```

### Optional Secrets (for security scanning):

```
SNYK_TOKEN="your-snyk-token"
```

## 🐳 Docker Deployment

### Local Docker Build

```bash
# Build the image
docker build -t kreativlab:latest .

# Run with docker-compose
docker-compose up -d
```

### Production Docker Deployment

```bash
# Build production image
docker build -t kreativlab:production .

# Tag for registry
docker tag kreativlab:production your-registry/kreativlab:latest

# Push to registry
docker push your-registry/kreativlab:latest
```

## 📊 Monitoring Setup

### 1. Health Checks

The application includes health check endpoints:
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status

### 2. Logging

Configure structured logging by setting:
```env
LOG_LEVEL="info"
NODE_ENV="production"
```

### 3. Error Tracking (Optional)

Add Sentry for error tracking:
```env
SENTRY_DSN="your-sentry-dsn"
```

## 🔧 Post-Deployment Configuration

### 1. Verify Deployment

Visit your deployed application and check:
- [ ] Landing page loads correctly
- [ ] Database connection works
- [ ] Environment variables are set
- [ ] No console errors

### 2. Set Up Domain (Optional)

In Vercel dashboard:
1. Go to project settings
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Enable Security Features

Ensure these are configured:
- [ ] HTTPS enforced
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Authentication working

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Check TypeScript errors

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists

3. **Environment Variables**
   - Verify all required vars are set
   - Check for typos in variable names
   - Ensure secrets are properly configured

### Support:

- Check GitHub Issues
- Review Vercel deployment logs
- Monitor application logs
- Use health check endpoints

## 📈 Performance Optimization

### For Production:

1. **Enable Redis Caching**
   ```env
   REDIS_URL="your-redis-connection-string"
   ```

2. **Configure CDN**
   - Vercel automatically provides CDN
   - Configure custom caching rules if needed

3. **Database Optimization**
   - Enable connection pooling
   - Configure read replicas if needed
   - Monitor query performance

4. **Monitoring**
   - Set up uptime monitoring
   - Configure alerting
   - Monitor resource usage

---

## 🎉 Deployment Complete!

Your KreativLab micro-agents platform is now live and ready for production use!

🔗 **Next Steps:**
- Test all functionality
- Set up monitoring alerts
- Configure backups
- Plan scaling strategy
- Add SSL certificates for custom domains