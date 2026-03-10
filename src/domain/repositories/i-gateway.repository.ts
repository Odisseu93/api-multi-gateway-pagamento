import type { GatewayEntity } from '#domain/entities/gateway.entity'

export interface IGatewayRepository {
  findById(id: number): Promise<GatewayEntity | null>
  findByType(type: string): Promise<GatewayEntity | null>
  findAllActiveOrderedByPriority(): Promise<GatewayEntity[]>
  update(id: number, data: Partial<Pick<GatewayEntity, 'isActive' | 'priority'>>): Promise<GatewayEntity>
}
