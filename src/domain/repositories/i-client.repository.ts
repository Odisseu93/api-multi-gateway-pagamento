import type { ClientEntity } from '#domain/entities/client.entity'

export interface IClientRepository {
  findById(id: number): Promise<ClientEntity | null>
  findByEmail(email: string): Promise<ClientEntity | null>
  findByUserId(userId: number): Promise<ClientEntity | null>
  findAll(): Promise<ClientEntity[]>
  create(client: Omit<ClientEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<ClientEntity>
}
