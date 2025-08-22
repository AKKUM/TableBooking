# --- Step 2: Backend (EB) ---
echo -e "${YELLOW}🔧 Deploying backend to Elastic Beanstalk...${NC}"

cd apps/backend

if [ ! -f ".elasticbeanstalk/config.yml" ]; then
  echo "Initializing EB..."
  eb init table-booking \
    --region $REGION \
    --platform "Docker"
fi

if ! eb status $ENVIRONMENT_NAME 2>/dev/null; then
  eb create $ENVIRONMENT_NAME --platform "Docker" --region $REGION \
    --instance_type t3.micro --single
else
  eb deploy $ENVIRONMENT_NAME
fi

BACKEND_URL=$(eb status $ENVIRONMENT_NAME --region $REGION | awk '/CNAME/ {print $2}')
cd ../..
