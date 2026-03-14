import User from '#models/user'
import Product from '#models/product'
import Gateway from '#models/gateway'
import { Role } from '#domain/enums/role.enum'
import db from '@adonisjs/lucid/services/db'

export class TestHelper {
  static async manualTruncate() {
    await db.rawQuery('SET FOREIGN_KEY_CHECKS = 0')
    await db.rawQuery('TRUNCATE TABLE transaction_products')
    await db.rawQuery('TRUNCATE TABLE transactions')
    await db.rawQuery('TRUNCATE TABLE products')
    await db.rawQuery('TRUNCATE TABLE gateways')
    await db.rawQuery('TRUNCATE TABLE users')
    await db.rawQuery('TRUNCATE TABLE clients')
    await db.rawQuery('SET FOREIGN_KEY_CHECKS = 1')
  }
  /**
   * Create a user for testing
   */
  static async createUser(overrides: Partial<any> = {}) {
    return await User.create({
      name: 'Test User',
      email: `test-${Math.random()}@example.com`,
      password: 'password123',
      role: Role.USER,
      ...overrides,
    })
  }

  /**
   * Create an admin user for testing
   */
  static async createAdmin(overrides: Partial<any> = {}) {
    return this.createUser({
      name: 'Admin User',
      role: Role.ADMIN,
      ...overrides,
    })
  }

  /**
   * Create a manager user for testing
   */
  static async createManager(overrides: Partial<any> = {}) {
    return this.createUser({
      name: 'Manager User',
      role: Role.MANAGER,
      ...overrides,
    })
  }

  /**
   * Create a finance user for testing
   */
  static async createFinance(overrides: Partial<any> = {}) {
    return this.createUser({
      name: 'Finance User',
      role: Role.FINANCE,
      ...overrides,
    })
  }

  /**
   * Create a product for testing
   */
  static async createProduct(overrides: Partial<any> = {}) {
    return await Product.create({
      name: 'Test Product',
      amount: 1000,
      isActive: true,
      ...overrides,
    })
  }

  /**
   * Create a gateway for testing
   */
  static async createGateway(overrides: Partial<any> = {}) {
    return await Gateway.create({
      name: 'Test Gateway',
      type: 'gateway_1',
      isActive: true,
      priority: 1,
      ...overrides,
    })
  }

  /**
   * Get auth header for a user
   */
  static async getAuthHeader(client: any, user: User) {
    const response = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    return {
      Authorization: `Bearer ${response.body().data.token}`,
    }
  }
}
