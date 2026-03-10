import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('clients')
        .onDelete('RESTRICT')

      // Nullable until a gateway successfully processes the charge
      table
        .integer('gateway_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('gateways')
        .onDelete('RESTRICT')

      // ID of the transaction in the external gateway system
      table.string('external_id', 100).nullable()

      table
        .enum('status', ['pending', 'paid', 'failed', 'refunded'])
        .notNullable()
        .defaultTo('pending')

      // Total amount in cents — always calculated server-side
      table.bigInteger('amount').unsigned().notNullable()

      // Only the last 4 digits are stored for security
      table.specificType('card_last_numbers', 'CHAR(4)').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['client_id'])
      table.index(['gateway_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
