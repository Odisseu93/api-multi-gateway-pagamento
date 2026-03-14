import type { GatewayEntity } from '#domain/entities/gateway.entity'

export interface IGatewayRepository {
  findById(id: number): Promise<GatewayEntity | null>
  findByType(type: string): Promise<GatewayEntity | null>
  findAllActiveOrderedByPriority(): Promise<GatewayEntity[]>
  findByPriority(priority: number): Promise<GatewayEntity | null>
  update(
    id: number,
    data: Partial<Pick<GatewayEntity, 'isActive' | 'priority'>>
  ): Promise<GatewayEntity>
  updateMany(
    updates: { id: number; data: Partial<Pick<GatewayEntity, 'isActive' | 'priority'>> }[]
  ): Promise<void>
}
