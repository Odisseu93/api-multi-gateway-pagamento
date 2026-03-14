import type { HttpContext } from '@adonisjs/core/http'
import { ListClientsUseCase } from '#application/use-cases/clients/list-clients.use-case'
import { GetClientUseCase } from '#application/use-cases/clients/get-client.use-case'
import { LucidClientRepository } from '#infrastructure/repositories/lucid/lucid-client.repository'
import { LucidTransactionRepository } from '#infrastructure/repositories/lucid/lucid-transaction.repository'

export default class ClientController {
  /** GET /api/v1/clients */
  async index({ response }: HttpContext) {
    const useCase = new ListClientsUseCase(new LucidClientRepository())

    const clients = await useCase.execute()
    return response.ok({ success: true, data: clients })
  }

  /** GET /api/v1/clients/:id */
  async show({ params, response }: HttpContext) {
    const useCase = new GetClientUseCase(
      new LucidClientRepository(),
      new LucidTransactionRepository()
    )

    const result = await useCase.execute(Number(params.id))
    return response.ok({ success: true, data: result })
  }
}
