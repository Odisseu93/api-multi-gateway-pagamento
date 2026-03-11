import type { IGatewayRepository } from '#domain/repositories/i-gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'
import type { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'

const TABLE = 'gateways'

type GatewayRow = GatewayEntity & { id: number }

export class InMemoryGatewayRepository implements IGatewayRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: number): Promise<GatewayEntity | null> {
    return this.db.findById<GatewayRow>(TABLE, id)
  }

  async findByType(type: string): Promise<GatewayEntity | null> {
    return this.db.findOne<GatewayRow>(TABLE, (g) => g.type === type)
  }

  async findAllActiveOrderedByPriority(): Promise<GatewayEntity[]> {
    return this.db
      .findMany<GatewayRow>(TABLE, (g) => g.isActive)
      .sort((a, b) => a.priority - b.priority)
  }

  async update(
    id: number,
    data: Partial<Pick<GatewayEntity, 'isActive' | 'priority'>>
  ): Promise<GatewayEntity> {
    return this.db.update<GatewayRow>(TABLE, id, data)
  }
}
