import type { IUserRepository } from '#domain/repositories/i-user.repository'
import type { UserEntity, UserEntityProps } from '#domain/entities/user.entity'
import type { CreateUserInputDto } from '#application/dtos/user.dto'
import { AppError } from '#shared/errors/app-error'

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInputDto): Promise<UserEntity> {
    const existing = await this.userRepository.findByEmail(input.email)
    if (existing) {
      throw new AppError(`Email '${input.email}' is already in use`, 409, 'EMAIL_ALREADY_IN_USE')
    }

    return this.userRepository.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    } satisfies Pick<UserEntityProps, 'name' | 'email' | 'password' | 'role'>)
  }
}
