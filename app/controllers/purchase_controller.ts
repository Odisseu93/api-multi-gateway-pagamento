import type { HttpContext } from '@adonisjs/core/http'
import { purchaseValidator } from '#validators/purchase.validator'
import { ProcessPurchaseUseCase } from '#application/use-cases/purchase/process-purchase.use-case'
import { LucidProductRepository } from '#infrastructure/repositories/lucid/lucid-product.repository'
import { LucidClientRepository } from '#infrastructure/repositories/lucid/lucid-client.repository'
import { LucidGatewayRepository } from '#infrastructure/repositories/lucid/lucid-gateway.repository'
import { LucidTransactionRepository } from '#infrastructure/repositories/lucid/lucid-transaction.repository'
import { GatewayAdapterFactory } from '#infrastructure/gateways/gateway-adapter.factory'

export default class PurchaseController {
  /**
   * POST /api/v1/transactions
   * Public: any user (authenticated or not) can buy.
   */
  async store({ request, response }: HttpContext) {
    const input = await request.validateUsing(purchaseValidator)

    const useCase = new ProcessPurchaseUseCase(
      new LucidProductRepository(),
      new LucidClientRepository(),
      new LucidGatewayRepository(),
      new LucidTransactionRepository(),
      GatewayAdapterFactory
    )

    const result = await useCase.execute(input)

    return response.created({ success: true, data: result })
  }
}
