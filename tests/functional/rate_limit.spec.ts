import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'
import limiter from '@adonisjs/limiter/services/main'

test.group('Rate Limiting (Functional)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
    // Clear all rate limit stores before each test to ensure isolation
    await limiter.clear()
  })

  test('strict limiter allows only 5 requests per minute (e.g. /login)', async ({ client }) => {
    const user = await TestHelper.createUser({ email: 'rate-limit-strict@example.com' })

    // Fire 5 successful/allowed requests
    for (let i = 0; i < 5; i++) {
      const response = await client.post('/api/v1/login').header('x-test-limit', 'true').json({
        email: user.email,
        password: 'password123',
      })
      response.assertStatus(200)
      response.assertHeader('X-RateLimit-Limit', '5')
      response.assertHeader('X-RateLimit-Remaining', (4 - i).toString())
    }

    // 6th request should be throttled
    const throttledResponse = await client
      .post('/api/v1/login')
      .header('x-test-limit', 'true')
      .json({
        email: user.email,
        password: 'password123',
      })

    throttledResponse.assertStatus(429)
    throttledResponse.assertBodyContains({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      },
    })
  })

  test('permissive limiter allows 20 requests per minute (e.g. GET /users)', async ({ client }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)

    // Fire 20 allowed requests
    for (let i = 0; i < 20; i++) {
      const response = await client
        .get('/api/v1/users')
        .header('x-test-limit', 'true')
        .headers(authHeader)
      response.assertStatus(200)
    }

    // 21st request should be throttled
    const throttledResponse = await client
      .get('/api/v1/users')
      .header('x-test-limit', 'true')
      .headers(authHeader)
    throttledResponse.assertStatus(429)
  })

  test('default limiter allows 10 requests per minute (e.g. POST /products)', async ({
    client,
  }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)

    // Fire 10 allowed requests
    for (let i = 0; i < 10; i++) {
      const response = await client
        .post('/api/v1/products')
        .header('x-test-limit', 'true')
        .headers(authHeader)
        .json({
          name: `Product ${i}`,
          amount: 1000,
          isActive: true,
        })
      response.assertStatus(201)
    }

    // 11th request should be throttled
    const throttledResponse = await client
      .post('/api/v1/products')
      .header('x-test-limit', 'true')
      .headers(authHeader)
      .json({
        name: 'Throttled Product',
        amount: 1000,
        isActive: true,
      })
    throttledResponse.assertStatus(429)
  })

  test('rate limit is keyed by user ID when authenticated', async ({ client }) => {
    const user1 = await TestHelper.createUser({ email: 'user1@example.com' })
    const user2 = await TestHelper.createUser({ email: 'user2@example.com' })

    const auth1 = await TestHelper.getAuthHeader(client, user1)
    const auth2 = await TestHelper.getAuthHeader(client, user2)

    // Exhaust limit for user1 (permissive = 20)
    for (let i = 0; i < 20; i++) {
      await client.get('/api/v1/clients').header('x-test-limit', 'true').headers(auth1)
    }

    // User1 is blocked
    const response1 = await client
      .get('/api/v1/clients')
      .header('x-test-limit', 'true')
      .headers(auth1)
    response1.assertStatus(429)

    // User2 should NOT be blocked even though they share same environment (and likely same IP in test)
    // We ALSO use the header here to verify User2 is NOT blocked by User1's actions
    const response2 = await client
      .get('/api/v1/clients')
      .header('x-test-limit', 'true')
      .headers(auth2)
    response2.assertStatus(200)
  })
})
