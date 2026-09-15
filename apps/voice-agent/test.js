// Quick test script for Hermes Voice Agent
const fetch = require('node-fetch');

async function test() {
  console.log('🧪 Testing Hermes Voice Agent...\n');
  
  const BASE_URL = 'http://localhost:8787';
  
  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const health = await fetch(`${BASE_URL}/health`);
    const healthData = await health.json();
    console.log('✅ Health:', healthData);
  } catch (error) {
    console.log('❌ Server not running! Start with: npm start');
    return;
  }
  
  // Test 2: Voice processing
  console.log('\n2. Testing voice processing...');
  try {
    const voice = await fetch(`${BASE_URL}/api/process-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '予約をしたいです',
        userId: 'test-user'
      })
    });
    const voiceData = await voice.json();
    console.log('✅ Voice response:', voiceData.reply?.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ Voice processing failed:', error.message);
  }
  
  // Test 3: Client search
  console.log('\n3. Testing client search...');
  try {
    const clients = await fetch(`${BASE_URL}/api/clients/search?name=Tanaka`);
    const clientsData = await clients.json();
    console.log('✅ Found clients:', clientsData.clients?.length || 0);
    if (clientsData.clients?.length > 0) {
      console.log('   First client:', clientsData.clients[0].display_name);
    }
  } catch (error) {
    console.log('❌ Client search failed:', error.message);
  }
  
  // Test 4: Create appointment
  console.log('\n4. Testing appointment creation...');
  try {
    // First get a client
    const clients = await fetch(`${BASE_URL}/api/clients/search?name=Demo`).then(r => r.json());
    const clientId = clients.clients?.[0]?.id;
    
    if (clientId) {
      const appointment = await fetch(`${BASE_URL}/api/create-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          service_name: 'Test Service',
          duration_minutes: 60,
          start_at: '2026-09-25T14:00:00Z'
        })
      });
      const apptData = await appointment.json();
      console.log('✅ Appointment created:', apptData.success);
    } else {
      console.log('⚠️ No test client found, skipping');
    }
  } catch (error) {
    console.log('❌ Appointment creation failed:', error.message);
  }
  
  console.log('\n🎉 All tests completed!\n');
}

test();
