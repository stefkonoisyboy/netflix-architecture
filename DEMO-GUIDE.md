# Circuit Breaker Demo Guide

## 🎯 How to See Circuit Breaker State Transitions

The circuit breaker state changes are logged in the **Gateway console**, not in the load generator output.

### Setup for Demo

**Terminal 1 - Recommendation Service:**
```bash
npm run start:recommendation
```

**Terminal 2 - Gateway (WATCH THIS ONE!):**
```bash
npm run start:gateway
```

**Terminal 3 - Load Generator:**
```bash
npm run load-test
```

## 📊 What You'll See

### In Gateway Console (Terminal 2):

```
🚀 Gateway running on http://localhost:3000
🟢 Circuit Breaker CLOSED              ← Normal state
✅ [101] SUCCESS for user 789
✅ [102] SUCCESS for user 456
❌ Request failed: Service Down         ← Failures start
❌ Request failed: Service Down
🔴 Circuit Breaker OPENED               ← Circuit opens!
⚠️  Fallback triggered
⚠️  Fallback triggered
... (wait 10 seconds) ...
🟡 Circuit Breaker HALF-OPEN            ← Testing recovery
✅ [201] SUCCESS for user 123
🟢 Circuit Breaker CLOSED               ← Recovered!
```

### In Load Generator Console (Terminal 3):

```
✅ [1] SUCCESS for user 123 (3ms)      ← Service healthy
✅ [2] SUCCESS for user 456 (4ms)
⚠️  [3] FALLBACK for user 789 (2ms)    ← Circuit opened
⚠️  [4] FALLBACK for user abc (2ms)
✅ [50] SUCCESS for user def (3ms)      ← Service recovered
```

## 🧪 Step-by-Step Demo

### 1. Start with Healthy Service

```bash
# Terminal 1
npm run start:recommendation

# Terminal 2 (KEEP VISIBLE)
npm run start:gateway

# You should see:
# 🟢 Circuit Breaker CLOSED
```

### 2. Make Some Successful Requests

```bash
# Terminal 3
curl http://localhost:3000/recommendations/user/123
curl http://localhost:3000/recommendations/user/456
curl http://localhost:3000/recommendations/user/789
```

**Gateway Console Shows:**
```
✅ Successful requests
🟢 Circuit Breaker CLOSED
```

### 3. Simulate Service Crash

```bash
# Terminal 3
curl -X POST http://localhost:3000/control/simulate-crash \
  -H "Content-Type: application/json" \
  -d "{\"shouldCrash\": true}"
```

**Recommendation Service Console Shows:**
```
Crash simulation ENABLED
```

### 4. Trigger Circuit Breaker

```bash
# Terminal 3
npm run load-test
```

**Watch Gateway Console (Terminal 2):**
```
❌ Request failed: Service is simulating a crash
❌ Request failed: Service is simulating a crash
❌ Request failed: Service is simulating a crash
🔴 Circuit Breaker OPENED                    ← HERE!
⚠️  Fallback triggered
⚠️  Fallback triggered
```

**Load Generator Shows:**
```
⚠️  [1] FALLBACK for user abc (2ms)
⚠️  [2] FALLBACK for user def (2ms)
⚠️  [3] FALLBACK for user 789 (2ms)
```

### 5. Restore Service

```bash
# Terminal 3
curl -X POST http://localhost:3000/control/simulate-crash \
  -H "Content-Type: application/json" \
  -d "{\"shouldCrash\": false}"
```

**Watch Gateway Console (Terminal 2):**
```
... (after 10 seconds) ...
🟡 Circuit Breaker HALF-OPEN                 ← Testing!
✅ Request succeeded
🟢 Circuit Breaker CLOSED                    ← Recovered!
```

## 🎬 For Your Presentation

### Split Screen Setup:
```
┌─────────────────────────────────────────────────────────┐
│  Gateway Console (Terminal 2)                           │
│  🟢 Circuit Breaker CLOSED                              │
│  ✅ Successful requests...                              │
├─────────────────────────────────────────────────────────┤
│  Load Generator (Terminal 3)                            │
│  ✅ [1] SUCCESS for user 123 (3ms)                      │
│  ✅ [2] SUCCESS for user 456 (4ms)                      │
└─────────────────────────────────────────────────────────┘
```

### Narration Script:

1. **"Here's our system running normally"**
   - Point to Gateway console showing 🟢 CLOSED
   - Point to successful requests

2. **"Now let's simulate a service failure"**
   - Run crash simulation command
   - Start load generator

3. **"Watch the circuit breaker detect the failures"**
   - Point to ❌ failures in Gateway console
   - **"And here it opens!"** - Point to 🔴 OPENED

4. **"Notice the system stays responsive with fallback content"**
   - Point to ⚠️ FALLBACK in load generator

5. **"Now we restore the service"**
   - Run restore command
   - **"The circuit breaker tests recovery"** - Point to 🟡 HALF-OPEN
   - **"And closes when healthy"** - Point to 🟢 CLOSED

## 🐛 Why You Don't See "FAILED" Responses

The circuit breaker **prevents** failures from reaching the client:

```
Without Circuit Breaker:
Request → Service Down → ❌ FAILED (timeout 3s)

With Circuit Breaker:
Request → Circuit Open → ⚠️ FALLBACK (instant)
```

You only see "FAILED" if:
- Gateway itself is down
- Network error occurs
- Circuit breaker is disabled

This is the **benefit** of the pattern - users never experience failures!

## 📈 Understanding the Output

### Load Generator Output:
- **✅ SUCCESS**: Service responded with real recommendations
- **⚠️ FALLBACK**: Circuit breaker returned cached content
- **❌ FAILED**: Network error (rare)

### Gateway Console Output:
- **🟢 CLOSED**: Normal operation
- **🔴 OPEN**: Service down, using fallback
- **🟡 HALF-OPEN**: Testing if service recovered

## 💡 Pro Tips

1. **Use split screen** to show both consoles simultaneously
2. **Increase load** by editing `scripts/load-generator.js`:
   ```javascript
   const REQUESTS_PER_SECOND = 10; // Increase from 5
   ```
3. **Adjust circuit breaker sensitivity** in `apps/gateway/src/recommendation.service.ts`:
   ```typescript
   errorThresholdPercentage: 30, // Opens faster
   ```
4. **Connect your React dashboard** to see real-time visualization
