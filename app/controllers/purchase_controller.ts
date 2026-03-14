import type { HttpContext } from '@adonisjs/core/http'
import { purchaseValidator } from '#validators/purchase.validator'
import { ProcessPurchaseUseCase } from '#application/use-cases/purchase/process_purchase.use_case'
import { LucidProductRepository } from '#infrastructure/repositories/lucid/lucid_product.repository'
import { LucidClientRepository } from '#infrastructure/repositories/lucid/lucid_client.repository'
import { LucidGatewayRepository } from '#infrastructure/repositories/lucid/lucid_gateway.repository'
import { LucidTransactionRepository } from '#infrastructure/repositories/lucid/lucid_transaction.repository'
import { GatewayAdapterFactory } from '#infrastructure/gateways/gateway_adapter_factory'

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
