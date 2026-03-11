import type { IClientRepository } from '#domain/repositories/i-client.repository'
import type { ClientEntity } from '#domain/entities/client.entity'
import { ClientEntity as ClientEntityClass } from '#domain/entities/client.entity'
import Client from '#models/client'

function toEntity(model: Client): ClientEntity {
  return new ClientEntityClass({
    id: model.id,
    userId: model.userId,
    name: model.name,
    email: model.email,
    createdAt: model.createdAt?.toJSDate(),
    updatedAt: model.updatedAt?.toJSDate() ?? null,
    deletedAt: model.deletedAt?.toJSDate() ?? null,
  })
}

export class LucidClientRepository implements IClientRepository {
  async findById(id: number): Promise<ClientEntity | null> {
    const model = await Client.find(id)
    return model ? toEntity(model) : null
  }

  async findByEmail(email: string): Promise<ClientEntity | null> {
    const model = await Client.findBy('email', email)
    return model ? toEntity(model) : null
  }

  async findByUserId(userId: number): Promise<ClientEntity | null> {
    const model = await Client.findBy('user_id', userId)
    return model ? toEntity(model) : null
  }

  async findAll(): Promise<ClientEntity[]> {
    const models = await Client.all()
    return models.map(toEntity)
  }

  async create(
    client: Omit<ClientEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<ClientEntity> {
    const model = await Client.create({
      userId: client.userId,
      name: client.name,
      email: client.email,
    })
    return toEntity(model)
  }
}
