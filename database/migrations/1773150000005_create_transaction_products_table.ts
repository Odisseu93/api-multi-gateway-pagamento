import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table
        .integer('transaction_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE')

      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')

      table.integer('quantity').unsigned().notNullable()

      // Price snapshot at the time of purchase — product price may change later
      table.bigInteger('unit_amount').unsigned().notNullable()

      table.timestamp('created_at').notNullable()

      // Composite index for fast lookup of items per transaction
      table.index(['transaction_id', 'product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
