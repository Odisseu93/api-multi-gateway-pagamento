import type { HttpContext } from '@adonisjs/core/http'
import { ListTransactionsUseCase } from '#application/use-cases/transactions/list-transactions.use-case'
import { GetTransactionUseCase } from '#application/use-cases/transactions/get-transaction.use-case'
import { RefundTransactionUseCase } from '#application/use-cases/refund/refund-transaction.use-case'
import { LucidTransactionRepository } from '#infrastructure/repositories/lucid/lucid-transaction.repository'
import { LucidRefundRepository } from '#infrastructure/repositories/lucid/lucid-refund.repository'
import { LucidGatewayRepository } from '#infrastructure/repositories/lucid/lucid-gateway.repository'
import { GatewayAdapterFactory } from '#infrastructure/gateways/gateway-adapter.factory'

export default class TransactionController {
  /** GET /api/v1/transactions */
  async index({ response }: HttpContext) {
    const useCase = new ListTransactionsUseCase(new LucidTransactionRepository())
    
    const transactions = await useCase.execute()
    return response.ok({ success: true, data: transactions })
  }

  /** GET /api/v1/transactions/:id */
  async show({ params, response }: HttpContext) {
    const useCase = new GetTransactionUseCase(new LucidTransactionRepository())
    
    const result = await useCase.execute(Number(params.id))
    return response.ok({ success: true, data: result })
  }

  /** POST /api/v1/transactions/:id/refund */
  async refund({ params, response }: HttpContext) {
    const useCase = new RefundTransactionUseCase(
      new LucidTransactionRepository(),
      new LucidRefundRepository(),
      new LucidGatewayRepository(),
      GatewayAdapterFactory
    )
    
    const result = await useCase.execute(Number(params.id))
    return response.ok({ success: true, data: result })
  }
}
