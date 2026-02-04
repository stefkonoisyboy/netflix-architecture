# Netflix Architecture Presentation Guide

## 🎯 Overview

This implementation demonstrates Netflix's resilience patterns using Nest.js:
- **API Gateway** with Circuit Breaker (Opossum)
- **Microservices** communication via TCP
- **Fallback mechanisms** for graceful degradation
- **Real-time observability** via Server-Sent Events

---

## 📊 Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    React Dashboard                        │
│              (Real-time SSE Connection)                   │
└────────────────────────┬─────────────────────────────────┘
                         │ SSE Stream
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   API Gateway (Port 3000)                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Circuit Breaker (Opossum)                  │  │
│  │  • Timeout: 3000ms                                 │  │
│  │  • Error Threshold: 50%                            │  │
│  │  • Reset Timeout: 10s                              │  │
│  │                                                     │  │
│  │  States: CLOSED → OPEN → HALF_OPEN                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Fallback: Cached "Trending Now" content                 │
└────────────────────────┬─────────────────────────────────┘
                         │ TCP
                         ▼
┌──────────────────────────────────────────────────────────┐
│         Recommendation Service (Port 3001)                │
│  • Personalized ML-based recommendations                  │
│  • Crash simulation toggle                                │
│  • TCP microservice transport                             │
└──────────────────────────────────────────────────────────┘
```

---

## 🎬 Demo Flow

### 1. **Introduction (2 min)**
- Explain Netflix's scale and why resilience matters
- Introduce the Circuit Breaker pattern
- Show the architecture diagram

### 2. **Normal Operation (3 min)**
```bash
# Start services
npm run start:recommendation  # Terminal 1
npm run start:gateway         # Terminal 2

# Make a request
curl http://localhost:3000/recommendations/user/123
```

**Show:**
- ✅ Successful response with personalized recommendations
- 🟢 Circuit Breaker in CLOSED state
- Dashboard showing successful requests

### 3. **Simulate Failure (5 min)**
```bash
# Enable crash simulation
curl -X POST http://localhost:3000/control/simulate-crash \
  -H "Content-Type: application/json" \
  -d "{\"shouldCrash\": true}"

# Generate load to trigger circuit breaker
npm run load-test
```

**Show:**
- ❌ Initial failures
- 🔴 Circuit Breaker transitions to OPEN
- ⚠️ Fallback responses with cached content
- Dashboard updating in real-time

**Key Point:** System stays responsive even when downstream service fails!

### 4. **Recovery (3 min)**
```bash
# Restore service
curl -X POST http://localhost:3000/control/simulate-crash \
  -H "Content-Type: application/json" \
  -d "{\"shouldCrash\": false}"
```

**Show:**
- 🟡 Circuit Breaker enters HALF_OPEN state
- Test requests succeed
- 🟢 Circuit Breaker returns to CLOSED
- System fully recovered

---

## 💡 Key Discussion Points

### Why Circuit Breaker?

**Problem:** Cascading Failures
```
Service A (slow) → Service B waits → Service C waits → Entire system down
```

**Solution:** Fail Fast
```
Service A (slow) → Circuit Breaker opens → Immediate fallback → System stays up
```

### State Management

| State | Behavior | Transition |
|-------|----------|------------|
| **CLOSED** | Normal operation, all requests pass through | → OPEN (50% failures) |
| **OPEN** | All requests fail immediately, fallback used | → HALF_OPEN (after 10s) |
| **HALF_OPEN** | Test requests to check recovery | → CLOSED (success) or OPEN (failure) |

### Fallback Strategy

**Without Fallback:**
- User sees error page
- Poor user experience
- Lost engagement

**With Fallback:**
- User sees "Trending Now" content
- Seamless experience
- System appears healthy

---

## 🔧 Technical Implementation

### Circuit Breaker Configuration

```typescript
const options = {
  timeout: 3000,              // Max wait time
  errorThresholdPercentage: 50, // Open at 50% failures
  resetTimeout: 10000,        // Try recovery after 10s
};

this.breaker = new CircuitBreaker(fire, options);

this.breaker.fallback(() => ({
  source: 'fallback-cache',
  recommendations: ['Trending Now', 'Netflix Originals']
}));
```

### Real-time Dashboard (SSE)

```typescript
// Backend: Gateway
@Sse('stream')
streamEvents(): Observable<MessageEvent> {
  return this.eventService.events$.pipe(
    map((event) => ({ data: event }))
  );
}

// Frontend: React Dashboard
const eventSource = new EventSource('http://localhost:3000/dashboard/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI based on event type
};
```

---

## 🎯 Nest.js Advantages

1. **Modular Architecture**
   - Clean separation of concerns
   - Easy to test and maintain

2. **Built-in Microservices Support**
   - TCP, Redis, MQTT, gRPC transports
   - No additional libraries needed

3. **Dependency Injection**
   - Easy to swap implementations
   - Testable code

4. **TypeScript First**
   - Type safety
   - Better IDE support

---

## 📈 Real-world Impact

**Netflix Scale:**
- 200M+ subscribers
- 1B+ hours of content streamed weekly
- Thousands of microservices

**Without Circuit Breaker:**
- One slow service → entire platform down
- User experience degraded
- Revenue loss

**With Circuit Breaker:**
- Isolated failures
- Graceful degradation
- 99.99% uptime

---

## 🚀 Running the Demo

### Quick Start
```bash
# Install dependencies
npm install

# Start all services
npm run start:all

# Or use Docker
docker-compose up --build
```

### Testing Commands
```bash
# Normal request
curl http://localhost:3000/recommendations/user/123

# Enable crash
curl -X POST http://localhost:3000/control/simulate-crash \
  -H "Content-Type: application/json" \
  -d "{\"shouldCrash\": true}"

# Load test
npm run load-test

# Check circuit breaker
curl http://localhost:3000/control/circuit-breaker
```

---

## 📚 References

- [Netflix Tech Blog - Hystrix](https://netflixtechblog.com/introducing-hystrix-for-resilience-engineering-13531c1ab362)
- [Opossum Circuit Breaker](https://github.com/nodeshift/opossum)
- [Nest.js Microservices](https://docs.nestjs.com/microservices/basics)
- [System Design - Netflix Architecture](https://www.geeksforgeeks.org/system-design/system-design-netflix-a-complete-architecture/)

---

## 🎤 Q&A Preparation

**Q: Why not just use retries?**
A: Retries can make things worse by overwhelming a struggling service. Circuit breaker fails fast and gives the service time to recover.

**Q: What if the fallback also fails?**
A: Implement multiple fallback layers (cache → static content → error page) and monitor fallback usage.

**Q: How do you decide the threshold?**
A: Based on SLA requirements and service characteristics. 50% is common, but adjust based on your needs.

**Q: Does this work with REST/GraphQL?**
A: Yes! The pattern works with any communication protocol. We used TCP for demonstration.

---

## ✅ Checklist Before Presentation

- [ ] Test all services locally
- [ ] Verify Docker build works
- [ ] Test dashboard SSE connection
- [ ] Run load generator successfully
- [ ] Prepare backup slides in case of demo failure
- [ ] Have curl commands ready in a script
- [ ] Test on presentation machine
