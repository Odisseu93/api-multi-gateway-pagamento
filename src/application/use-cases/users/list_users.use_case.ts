import type { UserRepository } from '#domain/repositories/user.repository'
import type { UserEntity } from '#domain/entities/user.entity'

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<UserEntity[]> {
    return this.userRepository.findAll()
  }
}
