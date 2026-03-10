import type { UserEntity } from '#domain/entities/user.entity'

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  findAll(): Promise<UserEntity[]>
  create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<UserEntity>
  update(id: number, data: Partial<Pick<UserEntity, 'name' | 'email' | 'password' | 'role'>>): Promise<UserEntity>
  delete(id: number): Promise<void>
}
