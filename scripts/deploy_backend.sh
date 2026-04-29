#!/bin/bash
# Deploy Flask backend to Google Cloud Run
gcloud run deploy smart-waste-backend \
  --source ../backend \
  --region asia-south1 \
  --allow-unauthenticated
