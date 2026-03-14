import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'refunds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table
        .integer('transaction_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('RESTRICT')

      // ID of the refund in the external gateway system
      table.string('external_id', 100).nullable()

      // Status: requested | approved | failed
      table.enum('status', ['requested', 'approved', 'failed']).notNullable().defaultTo('requested')

      // Refunded amount in cents
      table.bigInteger('amount').unsigned().notNullable()

      table.timestamp('created_at').notNullable()

      table.index(['transaction_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
