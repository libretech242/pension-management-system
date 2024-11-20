const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, cleanupTestDB } = require('../helpers');
const { createTestUser, generateAuthToken } = require('../fixtures/auth');
const { createTestPensionData } = require('../fixtures/pension');
const cache = require('../../src/utils/queryCache');

describe('Pension Report API Integration Tests', () => {
  let testUser;
  let authToken;
  let testData;

  beforeAll(async () => {
    await setupTestDB();
    testUser = await createTestUser({ role: 'admin' });
    authToken = generateAuthToken(testUser);
    testData = await createTestPensionData(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await cache.clear();
  });

  describe('GET /api/pension/summary', () => {
    it('should return pension summary with proper caching', async () => {
      // First request - should hit database
      const firstResponse = await request(app)
        .get('/api/pension/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(firstResponse.body.data).toBeDefined();
      expect(firstResponse.headers['x-cache-hit']).toBe('false');

      // Second request - should hit cache
      const secondResponse = await request(app)
        .get('/api/pension/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(secondResponse.body.data).toEqual(firstResponse.body.data);
      expect(secondResponse.headers['x-cache-hit']).toBe('true');
    });

    it('should handle date range filters correctly', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';

      const response = await request(app)
        .get('/api/pension/summary')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach(item => {
        expect(new Date(item.contributionDate)).toBeGreaterThanOrEqual(new Date(startDate));
        expect(new Date(item.contributionDate)).toBeLessThanOrEqual(new Date(endDate));
      });
    });

    it('should handle invalid date range', async () => {
      await request(app)
        .get('/api/pension/summary')
        .query({ startDate: 'invalid', endDate: '2023-12-31' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/pension/employee/:employeeId/contributions', () => {
    it('should return employee contributions with caching', async () => {
      const url = `/api/pension/employee/${testUser.id}/contributions`;

      // First request
      const firstResponse = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(firstResponse.body.data).toBeDefined();
      expect(firstResponse.headers['x-cache-hit']).toBe('false');

      // Second request - should hit cache
      const secondResponse = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(secondResponse.body.data).toEqual(firstResponse.body.data);
      expect(secondResponse.headers['x-cache-hit']).toBe('true');
    });

    it('should handle unauthorized access', async () => {
      const unauthorizedUser = await createTestUser({ role: 'employee' });
      const unauthorizedToken = generateAuthToken(unauthorizedUser);

      await request(app)
        .get(`/api/pension/employee/${testUser.id}/contributions`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when contributions are updated', async () => {
      const url = `/api/pension/employee/${testUser.id}/contributions`;

      // Initial request
      const firstResponse = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Update contribution
      await request(app)
        .post('/api/pension/contributions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId: testUser.id,
          amount: 1000,
          type: 'EMPLOYEE'
        })
        .expect(201);

      // Request after update - should not hit cache
      const secondResponse = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(secondResponse.body.data).not.toEqual(firstResponse.body.data);
      expect(secondResponse.headers['x-cache-hit']).toBe('false');
    });
  });

  describe('Performance tests', () => {
    it('should handle large dataset efficiently', async () => {
      // Create large dataset
      await createTestPensionData(testUser.id, 1000);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/pension/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Response should be under 1 second
      expect(response.body.data).toBeDefined();
    });

    it('should maintain performance with concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app)
          .get('/api/pension/summary')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;

      expect(averageTime).toBeLessThan(500); // Average response time should be under 500ms
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
