#!/bin/bash

# Source (staging app)
SOURCE_APP="mwap-server-staging"

# Target (review app)
TARGET_APP="mwap-server-feature-use-vmtkmo"

echo "🔁 Syncing config vars from $SOURCE_APP → $TARGET_APP..."

# Extract config vars from staging app, skip the header, then apply them to the review app
heroku config --app $SOURCE_APP | tail -n +2 | while read line; do
  key=$(echo $line | cut -d: -f1)
  value=$(echo $line | cut -d: -f2- | xargs)
  echo "Setting $key..."
  heroku config:set $key="$value" --app $TARGET_APP
done

echo "✅ Sync complete."