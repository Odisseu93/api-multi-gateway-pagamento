import type { IClientRepository } from '#domain/repositories/i-client.repository'
import type { ClientEntity } from '#domain/entities/client.entity'
import type { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'

const TABLE = 'clients'

type ClientRow = ClientEntity & { id: number }

export class InMemoryClientRepository implements IClientRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: number): Promise<ClientEntity | null> {
    return this.db.findById<ClientRow>(TABLE, id)
  }

  async findByEmail(email: string): Promise<ClientEntity | null> {
    return this.db.findOne<ClientRow>(TABLE, (c) => c.email === email)
  }

  async findByUserId(userId: number): Promise<ClientEntity | null> {
    return this.db.findOne<ClientRow>(TABLE, (c) => c.userId === userId)
  }

  async findAll(): Promise<ClientEntity[]> {
    return this.db.findAll<ClientRow>(TABLE)
  }

  async create(
    client: Omit<ClientEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<ClientEntity> {
    const now = new Date()
    return this.db.insert<ClientRow>(TABLE, {
      ...client,
      createdAt: now,
      updatedAt: null,
      deletedAt: null,
    } as Omit<ClientRow, 'id'>)
  }
}
