import type { IGatewayRepository } from '#domain/repositories/i-gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'
import { GatewayEntity as GatewayEntityClass } from '#domain/entities/gateway.entity'
import Gateway from '#models/gateway'

function toEntity(model: Gateway): GatewayEntity {
  return new GatewayEntityClass({
    id: model.id,
    name: model.name,
    type: model.type,
    isActive: model.isActive,
    priority: model.priority,
    credentials: model.credentials,
    createdAt: model.createdAt?.toJSDate(),
    updatedAt: model.updatedAt?.toJSDate() ?? null,
  })
}

export class LucidGatewayRepository implements IGatewayRepository {
  async findById(id: number): Promise<GatewayEntity | null> {
    const model = await Gateway.find(id)
    return model ? toEntity(model) : null
  }

  async findByType(type: string): Promise<GatewayEntity | null> {
    const model = await Gateway.findBy('type', type)
    return model ? toEntity(model) : null
  }

  async findAllActiveOrderedByPriority(): Promise<GatewayEntity[]> {
    const models = await Gateway.query()
      .where('is_active', true)
      .orderBy('priority', 'asc')
    return models.map(toEntity)
  }

  async update(
    id: number,
    data: Partial<Pick<GatewayEntity, 'isActive' | 'priority'>>
  ): Promise<GatewayEntity> {
    const model = await Gateway.findOrFail(id)
    model.merge(data as Record<string, unknown>)
    await model.save()
    return toEntity(model)
  }
}
