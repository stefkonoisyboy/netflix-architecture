# Netflix Architecture Demo - Nest.js Resilience Patterns

A demonstration of Netflix's resilience architecture patterns using Nest.js, featuring API Gateway, Circuit Breaker (Opossum), and microservices communication.

## Architecture Overview

```
┌─────────────┐
│   Client    │
│  Dashboard  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│      API Gateway            │
│  - Circuit Breaker (Opossum)│
│  - Fallback Logic           │
│  - SSE Dashboard Stream     │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Recommendation Service     │
│  - TCP Microservice         │
│  - Crash Simulation         │
└─────────────────────────────┘
```

## Features

- **Circuit Breaker Pattern**: Uses Opossum to prevent cascading failures
- **Fallback Mechanism**: Returns cached content when service is down
- **Real-time Dashboard**: SSE endpoint for live monitoring
- **Crash Simulation**: Toggle service health for testing
- **Load Generator**: Script to simulate traffic and trigger circuit breaker

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (for containerized deployment)

## Quick Start

### Local Development

1. **Install Dependencies**
```bash
npm install
```

2. **Start Recommendation Service**
```bash
npm run start:recommendation
```

3. **Start Gateway (in another terminal)**
```bash
npm run start:gateway
```

4. **Run Load Generator (optional)**
```bash
npm run load-test
```

### Docker Deployment

```bash
docker-compose up --build
```

## API Endpoints

### Gateway (Port 3000)

- `GET /recommendations/user/:userId` - Get recommendations for a user
- `POST /control/simulate-crash` - Toggle crash simulation
  ```json
  { "shouldCrash": true }
  ```
- `GET /control/health` - Check service health
- `GET /control/circuit-breaker` - Get circuit breaker stats
- `GET /dashboard/stream` - SSE endpoint for real-time events

### Recommendation Service (Port 3001)

TCP microservice - not directly accessible via HTTP

## Testing the Circuit Breaker

1. **Normal Operation**: Make requests to see successful responses
```bash
curl http://localhost:3000/recommendations/user/123
```

2. **Simulate Failure**: Enable crash mode
```bash
curl -X POST http://localhost:3000/control/simulate-crash \
  -H "Content-Type: application/json" \
  -d '{"shouldCrash": true}'
```

3. **Observe Circuit Breaker**: Run load generator to trigger the breaker
```bash
npm run load-test
```

4. **Watch Dashboard**: Connect to SSE stream
```bash
curl -N http://localhost:3000/dashboard/stream
```

## Circuit Breaker Configuration

- **Timeout**: 3000ms
- **Error Threshold**: 50%
- **Reset Timeout**: 10000ms (10 seconds)

## Dashboard Integration

Your React dashboard should connect to the SSE endpoint:

```javascript
const eventSource = new EventSource('http://localhost:3000/dashboard/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle: request, circuit_breaker, service_health, log events
};
```

## Project Structure

```
netflix-architecture/
├── apps/
│   ├── gateway/              # API Gateway with Circuit Breaker
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── app.controller.ts
│   │       ├── recommendation.service.ts
│   │       ├── dashboard.controller.ts
│   │       └── event.service.ts
│   └── recommendation-svc/   # Recommendation Microservice
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── app.controller.ts
│           └── app.service.ts
├── scripts/
│   └── load-generator.js     # Load testing script
├── docker-compose.yml
├── Dockerfile.gateway
├── Dockerfile.recommendation
└── package.json
```

## Key Discussion Points for Presentation

1. **Why Circuit Breaker?**
   - Prevents cascading failures
   - Fails fast instead of waiting for timeouts
   - Allows system to recover gracefully

2. **State Management**
   - **CLOSED**: Normal operation, requests pass through
   - **OPEN**: Service is down, requests fail immediately
   - **HALF_OPEN**: Testing if service recovered

3. **Observability**
   - Real-time SSE stream for dashboard
   - Circuit breaker state changes
   - Request success/failure tracking

4. **Nest.js Advantages**
   - Modular architecture with dependency injection
   - Built-in microservices support
   - Easy to swap implementations

## License

MIT
