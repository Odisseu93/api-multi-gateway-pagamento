import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 100).notNullable()
      table.string('email', 150).notNullable().unique()
      table.string('password').notNullable()
      table
        .string('role', 20)
        .notNullable()
        .defaultTo('USER')
        .comment('ADMIN | MANAGER | FINANCE | USER')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index(['role'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
