#!/bin/bash

echo "📱 AngelOs Hermes - Running on your phone..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "⏳ Installing dependencies (first time only)..."
  npm install
fi

# Start Expo
echo ""
echo "✅ Starting Expo dev server..."
echo "👉 Scan the QR code with Expo Go app on your phone"
echo ""

npx expo start
