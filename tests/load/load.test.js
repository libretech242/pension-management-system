const autocannon = require('autocannon');
const { promisify } = require('util');
const { createTestUser, clearDatabase } = require('../helpers');

const run = promisify(autocannon);

async function runLoadTest() {
  const testUser = await createTestUser({
    email: 'loadtest@example.com',
    password: 'Password123!'
  });

  const instance = await run({
    url: 'http://localhost:3000',
    connections: 100,
    pipelining: 10,
    duration: 30,
    workers: 4,
    headers: {
      'content-type': 'application/json'
    },
    requests: [
      {
        method: 'POST',
        path: '/api/auth/login',
        body: JSON.stringify({
          email: 'loadtest@example.com',
          password: 'Password123!'
        }),
        onResponse: (status, body, context) => {
          if (status === 200) {
            const { token } = JSON.parse(body);
            context.token = token;
          }
        }
      },
      {
        method: 'GET',
        path: '/api/employees',
        setupRequest: (req, context) => {
          req.headers['Authorization'] = `Bearer ${context.token}`;
          return req;
        }
      },
      {
        method: 'GET',
        path: '/api/reports/dashboard',
        setupRequest: (req, context) => {
          req.headers['Authorization'] = `Bearer ${context.token}`;
          return req;
        }
      }
    ]
  });

  console.log(instance.printResults());

  // Analyze results
  const results = {
    totalRequests: instance.requests.total,
    throughput: instance.requests.average,
    averageLatency: instance.latency.average,
    errors: instance.errors,
    timeouts: instance.timeouts,
    duration: instance.duration,
    connections: instance.connections,
    pipelining: instance.pipelining
  };

  // Check performance thresholds
  const thresholds = {
    maxLatency: 200, // ms
    minThroughput: 1000, // requests/sec
    maxErrorRate: 0.01 // 1%
  };

  const errorRate = instance.errors / instance.requests.total;

  const issues = [];
  if (instance.latency.average > thresholds.maxLatency) {
    issues.push(`High average latency: ${instance.latency.average}ms`);
  }
  if (instance.requests.average < thresholds.minThroughput) {
    issues.push(`Low throughput: ${instance.requests.average} req/sec`);
  }
  if (errorRate > thresholds.maxErrorRate) {
    issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
  }

  // Cleanup
  await clearDatabase();

  return {
    results,
    issues,
    passed: issues.length === 0
  };
}

// Run the load test
runLoadTest()
  .then(({ results, issues, passed }) => {
    console.log('\nLoad Test Results:');
    console.log('=================');
    console.log(`Total Requests: ${results.totalRequests}`);
    console.log(`Throughput: ${results.throughput} req/sec`);
    console.log(`Average Latency: ${results.averageLatency}ms`);
    console.log(`Errors: ${results.errors}`);
    console.log(`Timeouts: ${results.timeouts}`);
    console.log(`Duration: ${results.duration}s`);
    
    if (issues.length > 0) {
      console.log('\nPerformance Issues:');
      issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    console.log(`\nTest ${passed ? 'PASSED' : 'FAILED'}`);
    
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
