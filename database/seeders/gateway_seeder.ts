import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import encryption from '@adonisjs/core/services/encryption'
import Gateway from '#models/gateway'

/**
 * ⚠️  DEV/TEST ONLY — DO NOT RUN IN PRODUCTION
 *
 * This seeder inserts gateway credentials (even though encrypted) derived from
 * the BRIEFING's publicly known mock values. These are valid only against the
 * local `matheusprotzen/gateways-mock` container and must never be used in a
 * real payment environment.
 *
 * Credentials are encrypted with AdonisJS `encryption.encrypt()` using APP_KEY,
 * so the raw values are never persisted as plain text in the database.
 *
 * Guard: execution is blocked unless NODE_ENV is 'development' or 'test'.
 */
export default class GatewaySeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    if (app.inProduction) {
      console.warn('[GatewaySeeder] Skipped — must not run in production.')
      return
    }

    // Gateway 1: Bearer auth — adapter calls POST /login to obtain a token
    await Gateway.updateOrCreate(
      { type: 'gateway_1' },
      {
        name: 'Gateway 1',
        type: 'gateway_1',
        isActive: true,
        priority: 1,
        credentials: encryption.encrypt(
          JSON.stringify({
            email: 'dev@betalent.tech',
            token: 'FEC9BB078BF338F464F96B48089EB498',
          })
        ),
      }
    )

    // Gateway 2: Header-based auth (Gateway-Auth-Token + Gateway-Auth-Secret)
    await Gateway.updateOrCreate(
      { type: 'gateway_2' },
      {
        name: 'Gateway 2',
        type: 'gateway_2',
        isActive: true,
        priority: 2,
        credentials: encryption.encrypt(
          JSON.stringify({
            authToken: 'tk_f2198cc671b5289fa856',
            authSecret: '3d15e8ed6131446ea7e3456728b1211f',
          })
        ),
      }
    )

    console.log('[GatewaySeeder] Gateway 1 and Gateway 2 seeded.')
  }
}
