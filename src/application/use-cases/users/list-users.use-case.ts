import type { IUserRepository } from '#domain/repositories/i-user.repository'
import type { UserEntity } from '#domain/entities/user.entity'

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserEntity[]> {
    return this.userRepository.findAll()
  }
}
