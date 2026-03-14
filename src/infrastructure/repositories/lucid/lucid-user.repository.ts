import type { IUserRepository } from '#domain/repositories/i-user.repository'
import type { UserEntity } from '#domain/entities/user.entity'
import type { UserEntityProps } from '#domain/entities/user.entity'
import { UserEntity as UserEntityClass } from '#domain/entities/user.entity'
import { Role } from '#domain/enums/role.enum'
import User from '#models/user'
import { DateTime } from 'luxon'

function toEntity(model: User): UserEntity {
  return new UserEntityClass({
    id: model.id,
    name: model.name,
    email: model.email,
    password: model.password,
    role: model.role as Role,
    createdAt: model.createdAt?.toJSDate(),
    updatedAt: model.updatedAt?.toJSDate() ?? null,
    deletedAt: null,
  })
}

export class LucidUserRepository implements IUserRepository {
  async findById(id: number): Promise<UserEntity | null> {
    const model = await User.query().where('id', id).whereNull('deleted_at').first()
    return model ? toEntity(model) : null
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const model = await User.query().where('email', email).whereNull('deleted_at').first()
    return model ? toEntity(model) : null
  }

  async findAll(): Promise<UserEntity[]> {
    const models = await User.query().whereNull('deleted_at')
    return models.map(toEntity)
  }

  async create(user: Pick<UserEntityProps, 'name' | 'email' | 'password' | 'role'>): Promise<UserEntity> {
    const model = await User.create({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    })
    return toEntity(model)
  }

  async update(
    id: number,
    data: Partial<Pick<UserEntity, 'name' | 'email' | 'password' | 'role'>>
  ): Promise<UserEntity> {
    const model = await User.findOrFail(id)
    model.merge(data as Record<string, unknown>)
    await model.save()
    return toEntity(model)
  }

  async delete(id: number): Promise<void> {
    const model = await User.findOrFail(id)
    model.deletedAt = DateTime.now()
    await model.save()
  }
}
