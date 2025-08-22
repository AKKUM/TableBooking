#!/bin/bash

# AWS Deployment Script for TableBooking Application
# This script deploys both backend and frontend to AWS

set -e

echo "🚀 Starting AWS deployment for TableBooking application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="table-booking"
ENVIRONMENT_NAME="table-booking-prod"
REGION="us-east-1"
ECR_REPOSITORY="table-booking"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}❌ EB CLI is not installed. Please install it first.${NC}"
    echo "Install with: pip install awsebcli"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Build and push Docker images to ECR
echo -e "${YELLOW}📦 Building and pushing Docker images to ECR...${NC}"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $REGION

# Build and tag backend image
echo "Building backend image..."
cd apps/backend
docker build -t $ECR_REPOSITORY-backend .
docker tag $ECR_REPOSITORY-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY-backend:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY-backend:latest

# Build and tag frontend image
echo "Building frontend image..."
cd ../frontend
docker build -t $ECR_REPOSITORY-frontend .
docker tag $ECR_REPOSITORY-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY-frontend:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY-frontend:latest

cd ../..

echo -e "${GREEN}✅ Docker images built and pushed to ECR${NC}"

# Step 2: Deploy Backend to Elastic Beanstalk
echo -e "${YELLOW}🔧 Deploying backend to Elastic Beanstalk...${NC}"

# Initialize EB application if it doesn't exist
if [ ! -f ".elasticbeanstalk/config.yml" ]; then
    echo "Initializing Elastic Beanstalk application..."
    eb init $APP_NAME --platform python-3.11 --region $REGION
fi

# Create environment if it doesn't exist
if ! eb status $ENVIRONMENT_NAME 2>/dev/null; then
    echo "Creating Elastic Beanstalk environment..."
    eb create $ENVIRONMENT_NAME --instance-type t3.small --single-instance
else
    echo "Deploying to existing environment..."
    eb deploy $ENVIRONMENT_NAME
fi

echo -e "${GREEN}✅ Backend deployed to Elastic Beanstalk${NC}"

# Step 3: Deploy Frontend to S3 + CloudFront
echo -e "${YELLOW}🌐 Deploying frontend to S3 + CloudFront...${NC}"

# Build frontend
cd apps/frontend
npm run build

# Create S3 bucket if it doesn't exist
BUCKET_NAME="$APP_NAME-frontend-$(aws sts get-caller-identity --query Account --output text)"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || true

# Configure S3 bucket for static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload frontend files
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json \
    --query 'Distribution.Id' --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "CloudFront distribution already exists or failed to create"
else
    echo "CloudFront distribution created with ID: $DISTRIBUTION_ID"
fi

cd ../..

echo -e "${GREEN}✅ Frontend deployed to S3 + CloudFront${NC}"

# Step 4: Setup RDS Database
echo -e "${YELLOW}🗄️ Setting up RDS database...${NC}"

# Create RDS instance if it doesn't exist
DB_INSTANCE_IDENTIFIER="$APP_NAME-db"
if ! aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_IDENTIFIER --region $REGION &>/dev/null; then
    echo "Creating RDS PostgreSQL instance..."
    aws rds create-db-instance \
        --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --master-username table_user \
        --master-user-password table_password \
        --allocated-storage 20 \
        --storage-type gp2 \
        --region $REGION
else
    echo "RDS instance already exists"
fi

echo -e "${GREEN}✅ RDS database setup complete${NC}"

# Step 5: Final configuration
echo -e "${YELLOW}⚙️ Final configuration...${NC}"

# Get backend URL
BACKEND_URL=$(eb status $ENVIRONMENT_NAME --region $REGION | grep CNAME | awk '{print $2}')
echo "Backend URL: http://$BACKEND_URL"

# Get frontend URL
FRONTEND_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "Frontend URL: $FRONTEND_URL"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📋 Summary:"
echo "   Backend: http://$BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo "   Database: $DB_INSTANCE_IDENTIFIER"
echo ""
echo "🔧 Next steps:"
echo "   1. Update frontend API configuration to point to backend URL"
echo "   2. Configure environment variables in Elastic Beanstalk"
echo "   3. Set up custom domain names"
echo "   4. Configure SSL certificates"
echo "   5. Set up monitoring and alerts"
