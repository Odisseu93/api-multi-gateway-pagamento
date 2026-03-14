import type { GatewayRepository } from '#domain/repositories/gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'

export class ListGatewaysUseCase {
  constructor(private readonly gatewayRepository: GatewayRepository) {}

  async execute(): Promise<Array<GatewayEntity>> {
    const gateways = await this.gatewayRepository.findAllActiveOrderedByPriority()

    return gateways
  }
}
