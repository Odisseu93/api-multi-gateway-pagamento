import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import User from '#models/user'

/**
 * ⚠️  DEV/TEST ONLY — DO NOT RUN IN PRODUCTION
 *
 * This seeder creates a default ADMIN user with a well-known password.
 * Running it in production would expose a predictable privileged account.
 *
 * Guard: execution is blocked unless NODE_ENV is 'development' or 'test'.
 */
export default class UserSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    if (app.inProduction) {
      console.warn('[UserSeeder] Skipped — must not run in production.')
      return
    }

    await User.updateOrCreate(
      { email: 'admin@example.com' },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123456',
        role: 'ADMIN',
      }
    )

    console.log('[UserSeeder] Default ADMIN user seeded.')
  }
}
