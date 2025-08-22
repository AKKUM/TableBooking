# 🚀 AWS Deployment Guide for TableBooking Application

This guide provides step-by-step instructions for deploying your TableBooking application to AWS.

## 📋 Prerequisites

### 1. AWS Account Setup
- [ ] Create AWS account at [aws.amazon.com](https://aws.amazon.com)
- [ ] Set up billing and payment methods
- [ ] Create an IAM user with appropriate permissions
- [ ] Configure AWS CLI with your credentials

### 2. Local Development Environment
- [ ] Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [ ] Install [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html): `pip install awsebcli`
- [ ] Install [Docker](https://docs.docker.com/get-docker/)
- [ ] Install [Node.js](https://nodejs.org/) (for frontend build)

### 3. Required AWS Services
- [ ] Elastic Beanstalk (for backend)
- [ ] S3 (for frontend hosting)
- [ ] CloudFront (for CDN)
- [ ] RDS (for PostgreSQL database)
- [ ] ECR (for Docker images)

## 🔧 Step-by-Step Deployment

### Step 1: AWS CLI Configuration

```bash
# Configure AWS CLI
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### Step 2: Prepare Your Application

```bash
# Clone your repository
git clone <your-repo-url>
cd TableBooking

# Make deployment script executable
chmod +x deploy-aws.sh

# Update configuration files with your values
# - .ebextensions/01_environment.config
# - cloudfront-config.json
```

### Step 3: Environment Variables Setup

Create a `.env` file in the root directory:

```bash
# Backend Configuration
DATABASE_URL=postgresql://table_user:table_password@your-rds-endpoint:5432/table_booking
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id
```

### Step 4: Database Setup

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
    --db-instance-identifier table-booking-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username table_user \
    --master-user-password table_password \
    --allocated-storage 20 \
    --storage-type gp2 \
    --region us-east-1

# Wait for database to be available
aws rds wait db-instance-available --db-instance-identifier table-booking-db

# Get the endpoint
aws rds describe-db-instances \
    --db-instance-identifier table-booking-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
```

### Step 5: Deploy Backend to Elastic Beanstalk

```bash
# Navigate to backend directory
cd apps/backend

# Initialize Elastic Beanstalk application
eb init table-booking --platform python-3.11 --region us-east-1

# Create environment
eb create table-booking-prod --instance-type t3.small --single-instance

# Deploy
eb deploy table-booking-prod

# Get the URL
eb status table-booking-prod
```

### Step 6: Deploy Frontend to S3 + CloudFront

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies
npm install

# Build the application
npm run build

# Create S3 bucket
aws s3 mb s3://table-booking-frontend-$(aws sts get-caller-identity --query Account --output text)

# Configure static website hosting
aws s3 website s3://table-booking-frontend-$(aws sts get-caller-identity --query Account --output text) \
    --index-document index.html \
    --error-document index.html

# Upload files
aws s3 sync build/ s3://table-booking-frontend-$(aws sts get-caller-identity --query Account --output text) --delete

# Create CloudFront distribution
aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json
```

### Step 7: Update Frontend Configuration

Update `apps/frontend/src/services/api.ts` to point to your backend URL:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://your-eb-url.elasticbeanstalk.com';
```

### Step 8: Run Complete Deployment

```bash
# Run the automated deployment script
./deploy-aws.sh
```

## 🌐 Domain and SSL Setup

### Custom Domain Configuration

1. **Register a domain** (Route 53 or external provider)
2. **Create SSL certificate** in AWS Certificate Manager
3. **Update CloudFront distribution** to use custom domain
4. **Configure Route 53** to point to CloudFront

### SSL Certificate Setup

```bash
# Request SSL certificate
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names *.yourdomain.com \
    --validation-method DNS

# Validate the certificate (follow AWS console instructions)
```

## 📊 Monitoring and Logging

### CloudWatch Setup

```bash
# Enable CloudWatch logs for Elastic Beanstalk
aws elasticbeanstalk update-environment \
    --environment-name table-booking-prod \
    --option-settings Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=StreamLogs,Value=true
```

### Health Checks

- Backend: `/health` endpoint (already implemented)
- Frontend: S3 + CloudFront health monitoring
- Database: RDS monitoring and alerts

## 🔒 Security Configuration

### Security Groups

```bash
# Create security group for backend
aws ec2 create-security-group \
    --group-name table-booking-backend-sg \
    --description "Security group for TableBooking backend"

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
    --group-name table-booking-backend-sg \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name table-booking-backend-sg \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

### IAM Roles and Policies

Create appropriate IAM roles for:
- Elastic Beanstalk EC2 instances
- RDS access
- S3 access
- CloudFront management

## 💰 Cost Optimization

### Instance Sizing
- **Development**: t3.micro (free tier eligible)
- **Production**: t3.small or t3.medium
- **Database**: db.t3.micro (free tier eligible)

### Auto Scaling
```bash
# Configure auto scaling for production
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name table-booking-asg \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 1
```

## 🚨 Troubleshooting

### Common Issues

1. **Elastic Beanstalk deployment fails**
   - Check logs: `eb logs`
   - Verify requirements.txt
   - Check environment variables

2. **Frontend not loading**
   - Verify S3 bucket permissions
   - Check CloudFront distribution status
   - Validate build output

3. **Database connection issues**
   - Check security group rules
   - Verify RDS endpoint
   - Test connection locally

### Useful Commands

```bash
# Check Elastic Beanstalk status
eb status

# View logs
eb logs

# SSH into instance
eb ssh

# Check RDS status
aws rds describe-db-instances

# Monitor CloudFront
aws cloudfront get-distribution --id <distribution-id>
```

## 📈 Post-Deployment

### Performance Monitoring
- Set up CloudWatch dashboards
- Configure alarms for key metrics
- Monitor response times and error rates

### Backup Strategy
- Enable RDS automated backups
- Set up S3 versioning for frontend assets
- Regular database dumps

### Scaling Strategy
- Monitor resource usage
- Set up auto-scaling policies
- Plan for traffic spikes

## 🔄 Continuous Deployment

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to AWS
        run: |
          ./deploy-aws.sh
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 📞 Support and Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Elastic Beanstalk Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/)
- [AWS Pricing Calculator](https://calculator.aws/)

## ✅ Deployment Checklist

- [ ] AWS account configured
- [ ] Local tools installed (AWS CLI, EB CLI, Docker)
- [ ] Application containerized
- [ ] Database created and accessible
- [ ] Backend deployed to Elastic Beanstalk
- [ ] Frontend deployed to S3 + CloudFront
- [ ] SSL certificate configured
- [ ] Custom domain set up
- [ ] Monitoring and alerts configured
- [ ] Security groups configured
- [ ] Backup strategy implemented
- [ ] Performance testing completed

---

**🎉 Congratulations!** Your TableBooking application is now deployed on AWS.

**Next Steps:**
1. Test all functionality
2. Set up monitoring and alerts
3. Configure custom domain
4. Implement CI/CD pipeline
5. Plan scaling strategy
