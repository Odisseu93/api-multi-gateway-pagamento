/*
|--------------------------------------------------------------------------
| Rate Limiters
|--------------------------------------------------------------------------
|
| Named rate limiters applied to API routes. Three tiers are defined:
|
|  • strictLimiter     – 5 req/min  — login and public transaction endpoint
|  • defaultLimiter    – 10 req/min — authenticated write operations
|  • permissiveLimiter – 20 req/min — authenticated read/listing operations
|
| The rate limit key is the authenticated user ID when available, otherwise
| the client IP address, so users behind a shared NAT are not cross-limited.
|
*/

import limiter from '@adonisjs/limiter/services/main'
import app from '@adonisjs/core/services/app'

/**
 * Strict limiter: 5 requests per minute.
 * Applied to sensitive public endpoints (login, public transactions)
 * to protect against brute-force and abuse.
 */
export const strictLimiter = limiter.define('strict', ({ auth, request }) => {
  if (app.inTest && !request.header('x-test-limit')) {
    return limiter.noLimit()
  }

  const userId = auth.user?.id

  return limiter
    .allowRequests(5)
    .every('1 minute')
    .usingKey(userId ? `user_${userId}` : `ip_${request.ip()}`)
})

/**
 * Default limiter: 10 requests per minute.
 * Applied to authenticated mutation routes (POST / PUT / PATCH / DELETE).
 */
export const defaultLimiter = limiter.define('default', ({ auth, request }) => {
  if (app.inTest && !request.header('x-test-limit')) {
    return limiter.noLimit()
  }

  const userId = auth.user?.id

  return limiter
    .allowRequests(10)
    .every('1 minute')
    .usingKey(userId ? `user_${userId}` : `ip_${request.ip()}`)
})

/**
 * Permissive limiter: 20 requests per minute.
 * Applied to authenticated read/listing routes (GET).
 */
export const permissiveLimiter = limiter.define('permissive', ({ auth, request }) => {
  if (app.inTest && !request.header('x-test-limit')) {
    return limiter.noLimit()
  }

  const userId = auth.user?.id

  return limiter
    .allowRequests(20)
    .every('1 minute')
    .usingKey(userId ? `user_${userId}` : `ip_${request.ip()}`)
})
