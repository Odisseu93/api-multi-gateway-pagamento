import type { IClientRepository } from '#domain/repositories/i-client.repository'
import type { ClientEntity } from '#domain/entities/client.entity'
import { ClientEntity as ClientEntityClass } from '#domain/entities/client.entity'
import Client from '#models/client'

function toEntity(model: Client): ClientEntity {
  return new ClientEntityClass({
    id: model.id,
    name: model.name,
    email: model.email,
    createdAt: model.createdAt?.toJSDate(),
    updatedAt: model.updatedAt?.toJSDate() ?? null,
    deletedAt: model.deletedAt?.toJSDate() ?? null,
  })
}

export class LucidClientRepository implements IClientRepository {
  async findById(id: number): Promise<ClientEntity | null> {
    const model = await Client.query().where('id', id).whereNull('deleted_at').first()
    return model ? toEntity(model) : null
  }

  async findByEmail(email: string): Promise<ClientEntity | null> {
    const model = await Client.query().where('email', email).whereNull('deleted_at').first()
    return model ? toEntity(model) : null
  }

  async findAll(): Promise<ClientEntity[]> {
    const models = await Client.query().whereNull('deleted_at')
    return models.map(toEntity)
  }

  async create(
    client: Omit<ClientEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<ClientEntity> {
    const model = await Client.create({
      name: client.name,
      email: client.email,
    })
    return toEntity(model)
  }
}
