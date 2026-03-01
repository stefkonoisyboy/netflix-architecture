# Dashboard Setup Guide

## Quick Start

### 1. Start Backend Services

```bash
# Terminal 1 - Recommendation Service
npm run start:recommendation

# Terminal 2 - Gateway
npm run start:gateway
```

### 2. Start Dashboard

```bash
# Terminal 3 - Dashboard
cd dashboard
npm run dev
```

Open `http://localhost:5173` in your browser.

## Full Demo Flow

### Step 1: Verify Connection

- Dashboard should show "Connected to Gateway" in system logs
- Gateway status: **ONLINE**
- Recommendation Service status: **ONLINE** (green dot)
- Circuit Breaker: **CLOSED** (green)

### Step 2: Generate Traffic

Click **"Start Traffic"** button

You'll see:
- Live requests appearing in the stream
- All requests showing **SUCCESS** status (green badges)
- Request sources: "Personalized: Sci-Fi, Action"

### Step 3: Simulate Service Failure

Click **"Simulate Crash"** button

Watch the dashboard:
1. System log: "Crash simulation ENABLED"
2. Recommendation Service dot turns **RED**
3. Requests start failing
4. Circuit Breaker opens: **OPEN** (red)
5. All requests now show **FALLBACK** status (yellow badges)
6. Request sources: "Fallback: Trending Content"

### Step 4: Observe Resilience

Notice:
- Dashboard remains responsive
- Users still get content (fallback)
- No error pages or timeouts
- Failure rate increases in progress bar

### Step 5: Restore Service

Click **"Healthy"** button

Watch the recovery:
1. System log: "Crash simulation DISABLED"
2. Wait ~10 seconds
3. Circuit Breaker: **HALF_OPEN** (yellow) - testing recovery
4. First successful request
5. Circuit Breaker: **CLOSED** (green) - fully recovered
6. All requests back to **SUCCESS** status

## Architecture

```
┌─────────────────┐
│ React Dashboard │ ← You are here
│   (Port 5173)   │
└────────┬────────┘
         │ SSE Stream
         ▼
┌─────────────────┐
│  API Gateway    │
│   (Port 3000)   │
└────────┬────────┘
         │ TCP
         ▼
┌─────────────────┐
│ Recommendation  │
│    Service      │
│   (Port 3001)   │
└─────────────────┘
```

## Dashboard Features

### Microservices Control Panel

- **API Gateway**: Shows online/offline status
- **Recommendation Service**: 
  - Green dot = healthy
  - Red pulsing dot = crashed or offline
  - Toggle between "Healthy" and "Simulate Crash"

### Circuit Breaker Visualization

- **Visual Indicator**: Large circular icon
  - 🟢 Green shield = CLOSED (normal)
  - 🔴 Red warning = OPEN (service down)
  - 🟡 Yellow spinner = HALF_OPEN (testing)
- **State Label**: Current circuit breaker state
- **Failure Rate Bar**: Visual progress of failures
- **Statistics**: "Failures: X / Y"

### Live Request Stream

Each request shows:
- **Request ID**: Unique identifier
- **Status Badge**: SUCCESS (green) / FALLBACK (yellow) / FAILED (red)
- **Endpoint**: GET /recommendations/user/{userId}
- **Source**: Where the data came from

### System Logs

Real-time logs from the Gateway:
- 🟢 Green = Info (connections, recovery)
- 🟡 Yellow = Warning (crash enabled, testing)
- 🔴 Red = Error (connection lost, failures)

## Keyboard Shortcuts

- **Space**: Toggle traffic (when focused on button)
- **Escape**: Clear focus

## Customization

### Change Request Rate

Edit `dashboard/src/App.tsx`:

```typescript
// Line ~155
const interval = setInterval(async () => {
  // ...
}, 1500); // Change this value (milliseconds)
```

### Change Gateway URL

Create `dashboard/.env`:

```
VITE_GATEWAY_URL=http://your-gateway-url:3000
```

## Troubleshooting

### Dashboard Not Connecting

**Check:**
1. Gateway is running: `curl http://localhost:3000/control/health`
2. CORS is enabled (should be by default)
3. No firewall blocking port 3000

**Fix:**
- Restart Gateway
- Check Gateway console for errors

### No Requests Showing

**Check:**
1. "Start Traffic" button is active (red = running)
2. Gateway is responding: `curl http://localhost:3000/recommendations/user/123`

**Fix:**
- Click "Start Traffic" again
- Check browser console for errors

### Circuit Breaker Not Opening

**Check:**
1. Crash simulation is enabled
2. Traffic is running
3. Enough requests have been made (needs ~50% failure rate)

**Fix:**
- Enable "Simulate Crash"
- Wait for more requests to accumulate
- Check Gateway console for circuit breaker logs

## For Your Presentation

### Split Screen Setup

**Left Half**: Dashboard (browser)
**Right Half**: Gateway console (terminal)

This lets you show:
- Dashboard UI updates in real-time
- Gateway logs showing circuit breaker state changes
- Correlation between backend events and frontend visualization

### Talking Points

1. **"Here's our real-time dashboard"** - Show connected state
2. **"Let's generate some traffic"** - Click Start Traffic
3. **"Everything's healthy"** - Point to green indicators
4. **"Now let's simulate a failure"** - Click Simulate Crash
5. **"Watch the circuit breaker detect and respond"** - Point to state changes
6. **"Users still get content via fallback"** - Point to yellow badges
7. **"Let's restore the service"** - Click Healthy
8. **"The system automatically recovers"** - Point to recovery flow

## Next Steps

- Connect to Docker deployment: `VITE_GATEWAY_URL=http://localhost:3000`
- Customize colors/styling in `dashboard/src/App.tsx`
- Add more metrics (latency, throughput, etc.)
- Implement historical charts
