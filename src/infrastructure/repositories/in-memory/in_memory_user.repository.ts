import type { UserRepository } from '#domain/repositories/user.repository'
import type { UserEntity, UserEntityProps } from '#domain/entities/user.entity'
import type { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'

const TABLE = 'users'

type UserRow = UserEntity & { id: number }

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: number): Promise<UserEntity | null> {
    return this.db.findById<UserRow>(TABLE, id)
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.db.findOne<UserRow>(TABLE, (u) => u.email === email)
  }

  async findAll(): Promise<UserEntity[]> {
    return this.db.findAll<UserRow>(TABLE)
  }

  async create(
    user: Pick<UserEntityProps, 'name' | 'email' | 'password' | 'role'>
  ): Promise<UserEntity> {
    const now = new Date()
    return this.db.insert<UserRow>(TABLE, {
      ...user,
      createdAt: now,
      updatedAt: null,
      deletedAt: null,
    } as Omit<UserRow, 'id'>)
  }

  async update(
    id: number,
    data: Partial<Pick<UserEntity, 'name' | 'email' | 'password' | 'role'>>
  ): Promise<UserEntity> {
    return this.db.update<UserRow>(TABLE, id, data)
  }

  async delete(id: number): Promise<void> {
    this.db.delete<UserRow>(TABLE, id)
  }
}
