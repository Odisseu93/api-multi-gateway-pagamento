import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import Client from '#models/client'

export default class ClientSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    if (app.inProduction) {

      return
    }

    const clients = [
      { name: 'João Silva', email: 'joao@example.com' },
      { name: 'Maria Santos', email: 'maria@example.com' },
      { name: 'Pedro Alves', email: 'pedro@example.com' },
      { name: 'Ana Costa', email: 'ana@example.com' },
    ]

    for (const client of clients) {
      await Client.updateOrCreate({ email: client.email }, client)
    }


  }
}
