import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'

/**
 * ⚠️  DEV/TEST ONLY — DO NOT RUN IN PRODUCTION
 *
 * This is the entry-point seeder orchestrated by `node ace db:seed`.
 * It delegates to individual seeders in the correct dependency order.
 *
 * Individual seeders are also guarded by their own `static environment`
 * and `app.inProduction` checks — this top-level guard exists as an
 * additional safety net to prevent accidental execution in production.
 *
 * Run order: users → gateways → products
 */
export default class MainSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    if (app.inProduction) {
      console.warn('[MainSeeder] Aborted — seeders must not run in production.')
      return
    }

    // Import and run each sub-seeder in dependency order
    const { default: UserSeeder } = await import('./user_seeder.js')
    const { default: GatewaySeeder } = await import('./gateway_seeder.js')
    const { default: ProductSeeder } = await import('./product_seeder.js')

    await new UserSeeder(this.client).run()
    await new GatewaySeeder(this.client).run()
    await new ProductSeeder(this.client).run()
  }
}
