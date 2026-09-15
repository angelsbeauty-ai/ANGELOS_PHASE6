const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://hhzegavoyuicclsmrkwf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process voice message with database context
app.post('/api/process-voice', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Get database context
    const [appointments, clients, services] = await Promise.all([
      supabase.from('appointments').select('service_name, start_at, status').limit(5),
      supabase.from('clients').select('display_name, email, phone, status').limit(5),
      supabase.from('services').select('name, duration_minutes, standard_price').limit(10)
    ]);

    // Build context for AI
    const dbContext = `
Current Appointments:
${appointments.data?.map(a => `- ${a.service_name} at ${a.start_at} (${a.status})`).join('\n') || 'None'}

Recent Clients:
${clients.data?.map(c => `- ${c.display_name} (${c.status})`).join('\n') || 'None'}

Available Services:
${services.data?.map(s => `- ${s.name} (${s.duration_minutes} min, ¥${s.standard_price})`).join('\n') || 'None'}
`;

    // Call OpenAI with database context
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are Hermes, an AI assistant for Angels Beauty Academy in Okinawa, Japan. 
You have access to the business database. Respond in Japanese.

${dbContext}

When users ask about appointments, clients, or services, use this data to answer accurately.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const openaiData = await openaiResponse.json();
    const reply = openaiData.choices[0].message.content;

    res.json({ reply, status: 'success', context: dbContext });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create appointment
app.post('/api/create-appointment', async (req, res) => {
  try {
    const { clientId, serviceId, service_name, start_at, duration_minutes, status = 'confirmation_pending' } = req.body;

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        client_id: clientId,
        service_id: serviceId,
        service_name,
        duration_minutes,
        start_at,
        status,
        currency: 'JPY'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, appointment: data });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get client by name
app.get('/api/clients/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    const { data, error } = await supabase
      .from('clients')
      .select('id, display_name, email, phone, status')
      .ilike('display_name', `%${name}%`)
      .limit(5);

    if (error) throw error;

    res.json({ clients: data || [] });
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available time slots
app.get('/api/slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Get business hours
    const { data: hours } = await supabase
      .from('business_hours')
      .select('day_of_week, start_time, end_time');

    // Get existing appointments for the day
    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_at, end_at, duration_minutes')
      .gte('start_at', `${date}T00:00:00Z`)
      .lt('start_at', `${date}T23:59:59Z`);

    res.json({ 
      businessHours: hours || [],
      bookedSlots: appointments || []
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`🚀 Hermes Voice Agent running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
