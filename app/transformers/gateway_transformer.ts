import type { GatewayEntity } from '#domain/entities/gateway.entity'

export default class GatewayTransformer {
  static transform(gateway: GatewayEntity) {
    return {
      id: gateway.id,
      name: gateway.name,
      type: gateway.type,
      isActive: gateway.isActive,
      priority: gateway.priority,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt,
    }
  }

  static transformMany(gateways: GatewayEntity[]) {
    return gateways.map((gateway) => this.transform(gateway))
  }
}
