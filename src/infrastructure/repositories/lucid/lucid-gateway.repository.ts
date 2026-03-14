import type { IGatewayRepository } from '#domain/repositories/i-gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'
import { GatewayEntity as GatewayEntityClass } from '#domain/entities/gateway.entity'
import Gateway from '#models/gateway'
import db from '@adonisjs/lucid/services/db'

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

  async findByPriority(priority: number): Promise<GatewayEntity | null> {
    const model = await Gateway.findBy('priority', priority)
    return model ? toEntity(model) : null
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

  async updateMany(
    updates: { id: number; data: Partial<Pick<GatewayEntity, 'isActive' | 'priority'>> }[]
  ): Promise<void> {
    await db.transaction(async (trx) => {
      // 1. Temporarily move priorities to a high range to "free" the target values.
      // SQL unique constraints are often checked per-row even within a transaction.
      for (const update of updates) {
        if (update.data.priority !== undefined) {
          const model = await Gateway.findOrFail(update.id, { client: trx })
          // We use a safe offset (1000 + id) to ensure temporary uniqueness
          model.priority = 1000 + update.id
          await model.useTransaction(trx).save()
        }
      }

      // 2. Apply final target values
      for (const update of updates) {
        const model = await Gateway.findOrFail(update.id, { client: trx })
        model.merge(update.data as Record<string, unknown>)
        await model.useTransaction(trx).save()
      }
    })
  }
}
