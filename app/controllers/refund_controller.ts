import type { HttpContext } from '@adonisjs/core/http'
import { ListRefundsUseCase } from '#application/use-cases/refund/list-refunds.use-case'
import { GetRefundUseCase } from '#application/use-cases/refund/get-refund.use-case'
import { LucidRefundRepository } from '#infrastructure/repositories/lucid/lucid-refund.repository'

export default class RefundController {
  /** GET /api/v1/refunds */
  async index({ response }: HttpContext) {
    const useCase = new ListRefundsUseCase(new LucidRefundRepository())
    const refunds = await useCase.execute()
    return response.ok({ success: true, data: refunds })
  }

  /** GET /api/v1/refunds/:id */
  async show({ params, response }: HttpContext) {
    const useCase = new GetRefundUseCase(new LucidRefundRepository())
    const result = await useCase.execute(Number(params.id))
    return response.ok({ success: true, data: result })
  }
}
