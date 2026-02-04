# Quick Start Guide

## 🚀 Running the Application

### Option 1: Local Development (Recommended for Development)

**Terminal 1 - Start Recommendation Service:**
```bash
npm run start:recommendation
```

**Terminal 2 - Start Gateway:**
```bash
npm run start:gateway
```

**Terminal 3 - Run Load Test (Optional):**
```bash
npm run load-test
```

### Option 2: Docker (Recommended for Demo)

```bash
docker-compose up --build
```

## 🧪 Testing the Circuit Breaker

### 1. Test Normal Operation
```bash
curl http://localhost:3000/recommendations/user/123
```

Expected: Successful response with personalized recommendations.

### 2. Enable Crash Simulation
```bash
curl -X POST http://localhost:3000/control/simulate-crash ^
  -H "Content-Type: application/json" ^
  -d "{\"shouldCrash\": true}"
```

### 3. Trigger Circuit Breaker
```bash
npm run load-test
```

Watch the console logs to see:
- 🟢 Circuit Breaker CLOSED (normal)
- 🔴 Circuit Breaker OPENED (service down)
- ⚠️  Fallback responses

### 4. Restore Service
```bash
curl -X POST http://localhost:3000/control/simulate-crash ^
  -H "Content-Type: application/json" ^
  -d "{\"shouldCrash\": false}"
```

Watch as circuit breaker transitions:
- 🟡 Circuit Breaker HALF-OPEN (testing)
- 🟢 Circuit Breaker CLOSED (recovered)

## 📊 Connect Your React Dashboard

```javascript
const eventSource = new EventSource('http://localhost:3000/dashboard/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
  
  switch(data.type) {
    case 'request':
      // Update request stream
      break;
    case 'circuit_breaker':
      // Update circuit breaker state
      break;
    case 'service_health':
      // Update service status
      break;
    case 'log':
      // Update system logs
      break;
  }
};
```

## 🎯 API Endpoints

- `GET /recommendations/user/:userId` - Get recommendations
- `POST /control/simulate-crash` - Toggle crash simulation
- `GET /control/health` - Check service health
- `GET /control/circuit-breaker` - Get circuit breaker stats
- `GET /dashboard/stream` - SSE endpoint for dashboard

## 🎬 Presentation Flow

1. **Start both services** - Show they're running
2. **Make successful requests** - Show normal operation
3. **Enable crash simulation** - Explain what happens
4. **Run load generator** - Watch circuit breaker open
5. **Show fallback responses** - Explain graceful degradation
6. **Restore service** - Watch circuit breaker recover
7. **Show dashboard** - Real-time monitoring

## 📝 Key Talking Points

- **Circuit Breaker States**: Closed → Open → Half-Open
- **Fallback Strategy**: Cached content vs. service failure
- **Observability**: Real-time SSE stream for monitoring
- **Resilience**: System stays responsive even when downstream fails
