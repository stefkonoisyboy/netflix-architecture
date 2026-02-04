const http = require('http');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const REQUESTS_PER_SECOND = parseInt(process.env.RPS || '5', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || '60', 10);

let requestCount = 0;
let successCount = 0;
let failureCount = 0;
let fallbackCount = 0;

function generateUserId() {
  const userIds = ['123', '456', '789', 'abc', 'def'];
  return userIds[Math.floor(Math.random() * userIds.length)];
}

function makeRequest() {
  const userId = generateUserId();
  const url = `${GATEWAY_URL}/recommendations/user/${userId}`;

  const startTime = Date.now();
  
  http.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      requestCount++;
      const duration = Date.now() - startTime;
      
      try {
        const response = JSON.parse(data);
        
        if (response.source === 'fallback-cache') {
          fallbackCount++;
          console.log(`⚠️  [${requestCount}] FALLBACK for user ${userId} (${duration}ms)`);
        } else {
          successCount++;
          console.log(`✅ [${requestCount}] SUCCESS for user ${userId} (${duration}ms)`);
        }
      } catch (e) {
        failureCount++;
        console.log(`❌ [${requestCount}] FAILED for user ${userId} (${duration}ms)`);
      }
    });
  }).on('error', (err) => {
    requestCount++;
    failureCount++;
    console.log(`❌ [${requestCount}] ERROR for user ${userId}: ${err.message}`);
  });
}

function printStats() {
  console.log('\n📊 === Load Test Statistics ===');
  console.log(`Total Requests: ${requestCount}`);
  console.log(`✅ Success: ${successCount} (${((successCount/requestCount)*100).toFixed(1)}%)`);
  console.log(`⚠️  Fallback: ${fallbackCount} (${((fallbackCount/requestCount)*100).toFixed(1)}%)`);
  console.log(`❌ Failures: ${failureCount} (${((failureCount/requestCount)*100).toFixed(1)}%)`);
  console.log('================================\n');
}

console.log('🚀 Starting Load Generator...');
console.log(`Target: ${GATEWAY_URL}`);
console.log(`Rate: ${REQUESTS_PER_SECOND} requests/second`);
console.log(`Duration: ${DURATION_SECONDS} seconds`);
console.log('================================\n');

const interval = setInterval(() => {
  for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
    setTimeout(() => makeRequest(), (i * 1000) / REQUESTS_PER_SECOND);
  }
}, 1000);

const statsInterval = setInterval(printStats, 5000);

setTimeout(() => {
  clearInterval(interval);
  clearInterval(statsInterval);
  
  console.log('\n🏁 Load test completed!');
  printStats();
  process.exit(0);
}, DURATION_SECONDS * 1000);
