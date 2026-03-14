import type { IGatewayRepository } from '#domain/repositories/i-gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'

export class ListGatewaysUseCase {
  constructor(private readonly gatewayRepository: IGatewayRepository) {}

  async execute(): Promise<Array<GatewayEntity>> {
    const gateways = await this.gatewayRepository.findAllActiveOrderedByPriority()

    return gateways
  }
}
