import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import User from '#models/user'

export default class UserSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    if (app.inProduction) {

      return
    }

    const users = [
      { name: 'Admin User', email: 'admin@example.com', password: 'Password@123', role: 'ADMIN' },
      { name: 'Manager User', email: 'manager@example.com', password: 'Password@123', role: 'MANAGER' },
      { name: 'Finance User', email: 'finance@example.com', password: 'Password@123', role: 'FINANCE' },
      { name: 'Standard User', email: 'user@example.com', password: 'Password@123', role: 'USER' },
    ]

    for (const userData of users) {
      await User.updateOrCreate({ email: userData.email }, userData)
    }


  }
}
