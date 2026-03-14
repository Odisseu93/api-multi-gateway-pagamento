import type { UserEntity } from '#domain/entities/user.entity'

export default class UserTransformer {
  static transform(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  static transformMany(users: UserEntity[]) {
    return users.map((user) => this.transform(user))
  }
}
