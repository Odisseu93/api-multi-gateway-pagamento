import type { HttpContext } from '@adonisjs/core/http'
import { gatewayIdValidator, gatewayPriorityValidator } from '#validators/gateway.validator'
import { ToggleGatewayUseCase } from '#application/use-cases/gateways/toggle-gateway.use-case'
import { UpdateGatewayPriorityUseCase } from '#application/use-cases/gateways/update-gateway-priority.use-case'
import { ListGatewaysUseCase } from '#application/use-cases/gateways/list-gateways.use-case'
import { GetGatewayUseCase } from '#application/use-cases/gateways/get-gateway.use-case'
import { LucidGatewayRepository } from '#infrastructure/repositories/lucid/lucid-gateway.repository'
import GatewayTransformer from '#transformers/gateway_transformer'

export default class GatewayController {
  /** GET /api/v1/gateways */
  async index({ response }: HttpContext) {
    const useCase = new ListGatewaysUseCase(new LucidGatewayRepository())
    const gateways = await useCase.execute()

    return response.ok({
      success: true,
      data: GatewayTransformer.transformMany(gateways),
    })
  }

  /** GET /api/v1/gateways/:id */
  async show({ params, response }: HttpContext) {
    const { id } = await gatewayIdValidator.validate(params)

    const useCase = new GetGatewayUseCase(new LucidGatewayRepository())
    const gateway = await useCase.execute(id)

    return response.ok({
      success: true,
      data: GatewayTransformer.transform(gateway),
    })
  }

  /** PATCH /api/v1/gateways/:id/toggle */
  async toggle({ params, response }: HttpContext) {
    const { id } = await gatewayIdValidator.validate(params)

    const useCase = new ToggleGatewayUseCase(new LucidGatewayRepository())
    const gateway = await useCase.execute(id)

    return response.ok({ success: true, data: gateway })
  }

  /** PATCH /api/v1/gateways/:id/priority */
  async updatePriority({ params, request, response }: HttpContext) {
    const { id } = await gatewayIdValidator.validate(params)
    const { priority } = await request.validateUsing(gatewayPriorityValidator)

    const useCase = new UpdateGatewayPriorityUseCase(new LucidGatewayRepository())
    const result = await useCase.execute(id, priority)

    return response.ok({ success: true, data: result })
  }
}
