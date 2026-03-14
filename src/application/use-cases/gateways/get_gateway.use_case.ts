import type { IGatewayRepository } from '#domain/repositories/i-gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'
import { NotFoundError } from '#shared/errors/not-found.error'

export class GetGatewayUseCase {
  constructor(private readonly gatewayRepository: IGatewayRepository) {}

  async execute(id: number): Promise<GatewayEntity> {
    const gateway = await this.gatewayRepository.findById(id)
    if (!gateway) {
      throw new NotFoundError('Gateway', id)
    }

    return gateway
  }
}
