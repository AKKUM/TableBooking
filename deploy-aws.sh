#!/bin/bash
# AWS Deployment Script for TableBooking Application
# Backend: FastAPI (Python, Dockerized)
# Frontend: React (TypeScript)
# Database: PostgreSQL (RDS)
# Infra: Elastic Beanstalk, ECR, S3, CloudFront

set -euo pipefail

echo "🚀 Starting AWS deployment for TableBooking..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
APP_NAME="table-booking"
ENVIRONMENT_NAME="table-booking-prod"
REGION="eu-north-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BACKEND="$APP_NAME-backend"
ECR_FRONTEND="$APP_NAME-frontend"

# --- Prerequisites ---
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

command -v aws >/dev/null || { echo -e "${RED}❌ AWS CLI not found.${NC}"; exit 1; }
command -v eb >/dev/null || { echo -e "${RED}❌ EB CLI not found. Install with: pip install awsebcli${NC}"; exit 1; }
docker info >/dev/null || { echo -e "${RED}❌ Docker not running.${NC}"; exit 1; }

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# --- Step 1: ECR build & push ---
echo -e "${YELLOW}📦 Building & pushing Docker images...${NC}"

# Login to ECR
aws ecr get-login-password --region $REGION | \
docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Ensure repos exist
for repo in $ECR_BACKEND $ECR_FRONTEND; do
  aws ecr describe-repositories --repository-names $repo --region $REGION 2>/dev/null || \
  aws ecr create-repository --repository-name $repo --region $REGION
done

# Build backend
echo "➡️ Building backend..."
cd apps/backend
docker build -t $ECR_BACKEND .
docker tag $ECR_BACKEND:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND:latest
cd ../..

# Build frontend
echo "➡️ Building frontend..."
cd apps/frontend
docker build -t $ECR_FRONTEND .
docker tag $ECR_FRONTEND:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_FRONTEND:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_FRONTEND:latest
cd ../..

echo -e "${GREEN}✅ Docker images pushed to ECR${NC}"

# --- Step 2: Backend (EB) ---
echo -e "${YELLOW}🔧 Deploying backend to Elastic Beanstalk...${NC}"

if [ ! -f ".elasticbeanstalk/config.yml" ]; then
  echo "Initializing Elastic Beanstalk application (non-interactive)..."
  eb init $APP_NAME --platform docker --region $REGION --interactive 0
fi

if ! eb status $ENVIRONMENT_NAME 2>/dev/null; then
  eb create $ENVIRONMENT_NAME --platform docker --region $REGION \
    --instance_type t3.micro --single --cname $APP_NAME
else
  eb deploy $ENVIRONMENT_NAME
fi

BACKEND_URL=$(eb status $ENVIRONMENT_NAME --region $REGION | awk '/CNAME/ {print $2}')
echo -e "${GREEN}✅ Backend deployed: http://$BACKEND_URL${NC}"

# --- Step 3: Frontend (S3 + CloudFront) ---
echo -e "${YELLOW}🌐 Deploying frontend...${NC}"

cd apps/frontend
npm ci && npm run build
BUCKET_NAME="$APP_NAME-frontend-$ACCOUNT_ID"

aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || true
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
aws s3 sync build/ s3://$BUCKET_NAME --delete
cd ../..

FRONTEND_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo -e "${GREEN}✅ Frontend deployed: $FRONTEND_URL${NC}"

# --- Step 4: RDS ---
echo -e "${YELLOW}🗄️ Setting up RDS PostgreSQL...${NC}"

DB_INSTANCE_IDENTIFIER="$APP_NAME-db"
if ! aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_IDENTIFIER --region $REGION &>/dev/null; then
  aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username table_user \
    --master-user-password table_password \
    --allocated-storage 20 \
    --storage-type gp2 \
    --region $REGION
  echo -e "${YELLOW}⏳ RDS creation in progress... may take 5-10 mins${NC}"
else
  echo "✔ RDS instance already exists"
fi

echo -e "${GREEN}✅ RDS configured${NC}"

# --- Summary ---
echo -e "${GREEN}🎉 Deployment complete${NC}"
echo ""
echo "📋 Summary:"
echo "   Backend: http://$BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo "   Database: $DB_INSTANCE_IDENTIFIER"
echo ""
echo "🔧 Next steps:"
echo "   1. Point frontend API calls to backend URL"
echo "   2. Set env vars in EB (DB creds, API keys)"
echo "   3. Add custom domains (Route53) + SSL (ACM)"
echo "   4. Wait for RDS to be ready before migrations"
