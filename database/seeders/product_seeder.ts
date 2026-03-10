import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import Product from '#models/product'

/**
 * ⚠️  DEV/TEST ONLY — DO NOT RUN IN PRODUCTION
 *
 * This seeder inserts sample products for development and testing purposes.
 * Prices are stored in cents (integer) to avoid floating-point precision issues.
 *
 * Guard: execution is blocked unless NODE_ENV is 'development' or 'test'.
 */
export default class ProductSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    if (app.inProduction) {
      console.warn('[ProductSeeder] Skipped — must not run in production.')
      return
    }

    const products = [
      { name: 'Camiseta Básica', amount: 4990 },       // R$ 49,90
      { name: 'Tênis Esportivo', amount: 19990 },      // R$ 199,90
      { name: 'Mochila Executiva', amount: 14990 },    // R$ 149,90
      { name: 'Fone de Ouvido Bluetooth', amount: 9990 }, // R$ 99,90
      { name: 'Notebook Stand', amount: 7990 },        // R$ 79,90
      { name: 'Mouse Sem Fio', amount: 5990 },         // R$ 59,90
      { name: 'Teclado Mecânico', amount: 24990 },     // R$ 249,90
      { name: 'Monitor 24"', amount: 99990 },          // R$ 999,90
    ]

    for (const product of products) {
      await Product.updateOrCreate({ name: product.name }, { ...product, isActive: true })
    }

    console.log(`[ProductSeeder] ${products.length} products seeded.`)
  }
}
