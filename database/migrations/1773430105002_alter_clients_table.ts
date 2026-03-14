import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['user_id'], 'clients_user_id_foreign')
      table.dropUnique(['user_id'], 'clients_user_id_unique')
      table.dropColumn('user_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
    })
  }
}
