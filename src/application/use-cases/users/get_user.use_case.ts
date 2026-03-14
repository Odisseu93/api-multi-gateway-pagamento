import type { IUserRepository } from '#domain/repositories/i-user.repository'
import type { UserEntity } from '#domain/entities/user.entity'
import { NotFoundError } from '#shared/errors/not-found.error'

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }
    return user
  }
}
