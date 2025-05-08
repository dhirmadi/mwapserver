#!/bin/bash

# Exit immediately if any command fails
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🔨 Building the project..."
npm run build

echo "🚀 Starting the dev server..."
npm run start &

# Capture server PID to kill later
SERVER_PID=$!

# Wait briefly for the server to start
sleep 4

echo "🧪 Testing /api/v1/tenants/me route..."

# Replace this with a valid Auth0 JWT for local testing
JWT_TOKEN="your-test-jwt-token-here"

# Perform the request
curl -s -X GET http://localhost:3000/api/v1/tenants/me \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .

# Kill the server after the test
kill $SERVER_PID

echo "✅ Local test completed successfully."
