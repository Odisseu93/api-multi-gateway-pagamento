import type { HttpContext } from '@adonisjs/core/http'
import { ListClientsUseCase } from '#application/use-cases/clients/list_clients.use_case'
import { GetClientUseCase } from '#application/use-cases/clients/get_client.use_case'
import { LucidClientRepository } from '#infrastructure/repositories/lucid/lucid_client.repository'
import { LucidTransactionRepository } from '#infrastructure/repositories/lucid/lucid_transaction.repository'

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
