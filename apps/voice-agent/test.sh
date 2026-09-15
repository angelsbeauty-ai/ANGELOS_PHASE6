#!/bin/bash

echo "🧪 Testing Hermes Voice Agent..."
echo ""

# Check if server is running
echo "1. Testing health endpoint..."
HEALTH=$(curl -s http://localhost:8787/health 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "✅ Health check passed: $HEALTH"
else
  echo "❌ Server not running! Start it first:"
  echo "   npm start"
  exit 1
fi

echo ""
echo "2. Testing voice processing..."
VOICE_RESPONSE=$(curl -s -X POST http://localhost:8787/api/process-voice \
  -H "Content-Type: application/json" \
  -d '{"message": "予約をしたいです", "userId": "test-user"}' 2>/dev/null)

if echo "$VOICE_RESPONSE" | grep -q "reply"; then
  echo "✅ Voice processing works!"
  echo "Response: $VOICE_RESPONSE" | jq .
else
  echo "❌ Voice processing failed"
  echo "Response: $VOICE_RESPONSE"
fi

echo ""
echo "3. Testing client search..."
CLIENTS=$(curl -s "http://localhost:8787/api/clients/search?name=Tanaka" 2>/dev/null)

if echo "$CLIENTS" | grep -q "clients"; then
  echo "✅ Client search works!"
  echo "Found: $CLIENTS" | jq .
else
  echo "❌ Client search failed"
  echo "Response: $CLIENTS"
fi

echo ""
echo "4. Testing appointment creation..."
# Get a test client ID first
TEST_CLIENT=$(curl -s "http://localhost:8787/api/clients/search?name=Demo" | jq -r '.clients[0].id')

if [ "$TEST_CLIENT" != "null" ]; then
  APPOINTMENT=$(curl -s -X POST http://localhost:8787/api/create-appointment \
    -H "Content-Type: application/json" \
    -d "{\"clientId\":\"$TEST_CLIENT\",\"service_name\":\"Test Service\",\"duration_minutes\":60,\"start_at\":\"2026-09-25T14:00:00Z\"}" 2>/dev/null)
  
  if echo "$APPOINTMENT" | grep -q "success"; then
    echo "✅ Appointment creation works!"
    echo "Created: $APPOINTMENT" | jq .
  else
    echo "❌ Appointment creation failed"
    echo "Response: $APPOINTMENT"
  fi
else
  echo "⚠️ No test client found, skipping appointment test"
fi

echo ""
echo "🎉 All tests completed!"
