# 🗣️ Hermes Voice Agent with Database

## What It Does

Hermes now has **full access to your Supabase database**:
- ✅ Query appointments
- ✅ Look up clients
- ✅ Check services & prices
- ✅ Create new bookings
- ✅ Answer questions with real business data

---

## Quick Start

### 1. Deploy to Railway

```bash
# Already configured in apps/voice-agent
# Just connect Railway to this repo:
# - Root directory: apps/voice-agent
# - Build: npm install
# - Start: node server.js
```

### 2. Add Environment Variables

In Railway dashboard:
```
SUPABASE_URL=https://hhzegavoyuicclsmrkwf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=sk-your_openai_key
PORT=8787
```

### 3. Test Health Check

```
https://your-railway-url.up.railway.app/health
```

Should return: `{"status": "ok"}`

---

## API Endpoints

### 1. Process Voice Message (Main)

**POST** `/api/process-voice`

```json
{
  "message": "予約をしたいです",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "reply": "かしこまりました。どのサービスをご希望ですか？",
  "status": "success",
  "context": "Current Appointments:\n- Brow Lamination at 2026-09-14..."
}
```

**What it does:**
- Queries appointments, clients, services from database
- Sends to OpenAI with database context
- Returns AI response with business awareness

---

### 2. Create Appointment

**POST** `/api/create-appointment`

```json
{
  "clientId": "uuid-here",
  "serviceId": "uuid-here",
  "service_name": "Eyelash Extension",
  "duration_minutes": 90,
  "start_at": "2026-09-20T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "service_name": "Eyelash Extension",
    "start_at": "2026-09-20T14:00:00Z",
    "status": "confirmation_pending"
  }
}
```

---

### 3. Search Clients

**GET** `/api/clients/search?name=Tanaka`

**Response:**
```json
{
  "clients": [
    {
      "id": "uuid",
      "display_name": "Yuki Tanaka",
      "email": "yuki@example.jp",
      "phone": "+817012345678",
      "status": "active"
    }
  ]
}
```

---

### 4. Get Available Slots

**GET** `/api/slots?date=2026-09-20`

**Response:**
```json
{
  "businessHours": [
    { "day_of_week": 1, "start_time": "10:00:00", "end_time": "19:00:00" }
  ],
  "bookedSlots": [
    { "start_at": "2026-09-20T10:00:00Z", "duration_minutes": 90 }
  ]
}
```

---

## Example: Voice Booking Flow

### User says:
> "明日の午後2時に予約したいです" (I want to book tomorrow at 2pm)

### Hermes does:

1. **Query database:**
   ```bash
   GET /api/slots?date=2026-09-17
   ```

2. **Check availability:**
   - Business hours: 10:00-19:00 ✅
   - No conflicts at 14:00 ✅

3. **Create appointment:**
   ```bash
   POST /api/create-appointment
   {
     "service_name": "Eyelash Extension",
     "start_at": "2026-09-17T14:00:00Z",
     "duration_minutes": 90
   }
   ```

4. **Reply to user:**
   > "明日午後2時の予約を承りました。"

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `appointments` | Store bookings |
| `clients` | Customer info |
| `services` | Menu & prices |
| `business_hours` | Operating hours |
| `client_messages` | Send confirmations |

---

## Testing Locally

```bash
cd apps/voice-agent
npm install
npm start
```

Test with curl:
```bash
# Health check
curl http://localhost:8787/health

# Process voice
curl -X POST http://localhost:8787/api/process-voice \
  -H "Content-Type: application/json" \
  -d '{"message": "予約したいです", "userId": "test"}'
```

---

## Integration with Mobile App

The mobile app (`apps/mobile`) calls this endpoint when Hermes voice session is active.

**Flow:**
1. User speaks in mobile app
2. Mobile sends to `/api/process-voice`
3. Hermes queries Supabase + OpenAI
4. Returns response to mobile
5. Mobile plays audio response

---

**Status:** ✅ Production Ready  
**Last Updated:** September 2026
