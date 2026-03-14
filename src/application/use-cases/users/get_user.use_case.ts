import type { UserRepository } from '#domain/repositories/user.repository'
import type { UserEntity } from '#domain/entities/user.entity'
import { NotFoundError } from '#shared/errors/not_found_error'

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }
    return user
  }
}
