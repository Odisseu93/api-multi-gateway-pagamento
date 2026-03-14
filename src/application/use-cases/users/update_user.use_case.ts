import type { UserRepository } from '#domain/repositories/user.repository'
import type { UserEntity } from '#domain/entities/user.entity'
import type { UpdateUserInputDto } from '#application/dtos/user.dto'
import { AppError } from '#shared/errors/app_error'

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number, input: UpdateUserInputDto): Promise<UserEntity> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    }

    if (input.email && input.email !== user.email) {
      const alreadyTaken = await this.userRepository.findByEmail(input.email)
      if (alreadyTaken) {
        throw new AppError(
          `Email '${input.email}' is already in use by another user`,
          409,
          'CONFLICT'
        )
      }
    }

    return this.userRepository.update(id, input)
  }
}
