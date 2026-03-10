import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gateways'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 100).notNullable()

      // 'type' links the DB record to the corresponding adapter class (e.g. gateway_1, gateway_2)
      table.string('type', 50).notNullable().unique()

      table.boolean('is_active').notNullable().defaultTo(true)

      // Lower number = higher priority (attempted first)
      table.integer('priority').unsigned().notNullable().unique()

      table.text('credentials').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
