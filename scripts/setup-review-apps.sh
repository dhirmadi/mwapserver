#!/bin/bash
# Script to set up Heroku pipeline and configure review apps to copy config vars from staging

# Check if HEROKU_API_KEY is set
if [ -z "$HEROKU_API_KEY" ]; then
  echo "Error: HEROKU_API_KEY environment variable is not set."
  echo "Please set it with: export HEROKU_API_KEY=your-api-key"
  exit 1
fi

# Define variables
STAGING_APP="mwap-server-staging"
PIPELINE_NAME="mwap-server-pipeline"
GITHUB_REPO="dhirmadi/mwapserver"

# Create a Heroku pipeline if it doesn't exist
echo "Checking if pipeline $PIPELINE_NAME exists..."
PIPELINE_ID=$(curl -s -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Accept: application/vnd.heroku+json; version=3" \
  https://api.heroku.com/pipelines | jq -r ".[] | select(.name==\"$PIPELINE_NAME\") | .id")

if [ -z "$PIPELINE_ID" ]; then
  echo "Creating pipeline $PIPELINE_NAME..."
  PIPELINE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $HEROKU_API_KEY" \
    -H "Accept: application/vnd.heroku+json; version=3" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$PIPELINE_NAME\"}" \
    https://api.heroku.com/pipelines)
  
  PIPELINE_ID=$(echo $PIPELINE_RESPONSE | jq -r '.id')
  echo "Pipeline created with ID: $PIPELINE_ID"
else
  echo "Pipeline already exists with ID: $PIPELINE_ID"
fi

# Add staging app to the pipeline if not already added
echo "Checking if $STAGING_APP is in the pipeline..."
COUPLING_EXISTS=$(curl -s -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Accept: application/vnd.heroku+json; version=3" \
  https://api.heroku.com/pipelines/$PIPELINE_ID/pipeline-couplings | jq -r ".[] | select(.app.name==\"$STAGING_APP\") | .id")

if [ -z "$COUPLING_EXISTS" ]; then
  echo "Adding $STAGING_APP to pipeline..."
  curl -s -X POST \
    -H "Authorization: Bearer $HEROKU_API_KEY" \
    -H "Accept: application/vnd.heroku+json; version=3" \
    -H "Content-Type: application/json" \
    -d "{\"app\":\"$STAGING_APP\",\"pipeline\":\"$PIPELINE_ID\",\"stage\":\"staging\"}" \
    https://api.heroku.com/pipeline-couplings
  echo "App added to pipeline."
else
  echo "App is already in the pipeline."
fi

# Enable review apps for the pipeline
echo "Enabling review apps for the pipeline..."
curl -s -X POST \
  -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Accept: application/vnd.heroku+json; version=3" \
  -H "Content-Type: application/json" \
  -d "{
    \"pipeline\": \"$PIPELINE_ID\",
    \"source_blob\": {
      \"url\": \"https://github.com/$GITHUB_REPO/archive/main.tar.gz\"
    },
    \"environment\": {
      \"wait-for-ci\": false,
      \"automatic-review-apps\": true,
      \"destroy-stale-apps\": true,
      \"stale-days\": 7,
      \"deployment-wait\": 10,
      \"base-name\": \"mwap-review\"
    }
  }" \
  https://api.heroku.com/pipelines/$PIPELINE_ID/review-app-config

echo "Review apps enabled."

# Configure review apps to copy config vars from staging
echo "Configuring review apps to copy config vars from staging..."
curl -s -X PATCH \
  -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Accept: application/vnd.heroku+json; version=3" \
  -H "Content-Type: application/json" \
  -d "{
    \"environment\": {
      \"copy-config-vars\": true
    }
  }" \
  https://api.heroku.com/pipelines/$PIPELINE_ID/review-app-config

echo "Review apps configured to copy config vars from staging."
echo "Setup complete!"