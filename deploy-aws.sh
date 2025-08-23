#!/bin/bash
set -e

# -----------------------------
# CONFIGURATION
# -----------------------------
APP_NAME="table-booking"
ECR_BACKEND="table-booking-backend"
REGION="eu-north-1"
ENVIRONMENT_NAME="table-booking-prod"

# -----------------------------
# COLORS
# -----------------------------
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

# -----------------------------
# AWS ACCOUNT ID
# -----------------------------
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: $ACCOUNT_ID${NC}"

# -----------------------------
# STEP 1: Push Docker Image to ECR
# -----------------------------
echo -e "${YELLOW}🐳 Building and pushing Docker image to ECR...${NC}"

# Authenticate Docker to ECR
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Ensure ECR repo exists
aws ecr describe-repositories --repository-names $ECR_BACKEND --region $REGION >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name $ECR_BACKEND --region $REGION

# Build backend image
docker build -t $ECR_BACKEND ./apps/backend

# Tag image for ECR
docker tag $ECR_BACKEND:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND:latest

# Push to ECR
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND:latest
echo -e "${GREEN}✅ Docker images pushed to ECR${NC}"

# -----------------------------
# STEP 2: Elastic Beanstalk Deploy
# -----------------------------
echo -e "${YELLOW}🔧 Deploying backend to Elastic Beanstalk...${NC}"

# Generate Dockerrun.aws.json at project root
cat > Dockerrun.aws.json <<EOL
{
  "AWSEBDockerrunVersion": 1,
  "Image": {
    "Name": "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND:latest",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 8000
    }
  ]
}
EOL
echo -e "${GREEN}✅ Generated Dockerrun.aws.json at project root${NC}"

# Initialize EB CLI if not already done
if [ ! -d ".elasticbeanstalk" ]; then
  echo "⚙️ Running eb init..."
  eb init $APP_NAME \
    --platform "Docker" \
    --region $REGION \
    --profile default \
    --create-application
  echo -e "${GREEN}✅ EB CLI initialized${NC}"
fi

# Create environment if missing, else deploy update
if ! eb status $ENVIRONMENT_NAME --region $REGION >/dev/null 2>&1; then
  echo "➡️ Environment not found. Creating new environment: $ENVIRONMENT_NAME"
  eb create $ENVIRONMENT_NAME \
    --platform "Docker" \
    --region $REGION \
    --instance_type t3.micro \
    --single
else
  echo "➡️ Environment exists. Deploying update..."
  eb deploy $ENVIRONMENT_NAME --region $REGION
fi

# Fetch deployed backend URL
BACKEND_URL=$(eb status $ENVIRONMENT_NAME --region $REGION | awk '/CNAME/ {print $2}')
echo -e "${GREEN}✅ Backend deployed: http://$BACKEND_URL${NC}"

# -----------------------------
# STEP 3: Frontend (React + TypeScript)
# -----------------------------
echo -e "${YELLOW}🌐 Building and deploying frontend...${NC}"

cd apps/frontend

# Install dependencies and build React app
npm install
npm run build

# Sync build to S3 (bucket must exist)
aws s3 sync build/ s3://$APP_NAME-frontend --delete --region $REGION

# Set S3 bucket to host static site
aws s3 website s3://$APP_NAME-frontend/ --index-document index.html --error-document index.html

FRONTEND_URL="http://$APP_NAME-frontend.s3-website.$REGION.amazonaws.com"
echo -e "${GREEN}✅ Frontend deployed: $FRONTEND_URL${NC}"
