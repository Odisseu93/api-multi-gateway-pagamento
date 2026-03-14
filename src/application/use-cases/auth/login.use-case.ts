import type { UserRepository } from '#domain/repositories/user.repository'
import type { LoginInputDto, LoginOutputDto } from '#application/dtos/auth.dto'
import { AppError } from '#shared/errors/app_error'

export interface HashService {
  verify(hashedValue: string, plainValue: string): Promise<boolean>
}

/**
 * LoginUseCase
 *
 * Validates user credentials and returns a simple bearer token string.
 * The actual token generation is delegated to the caller (HTTP controller)
 * which has access to AdonisJS Auth — this use case only validates credentials.
 *
 * Why: keeps the use case free of framework dependencies, testable with a fake hash service.
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hash: HashService
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const passwordMatch = await this.hash.verify(user.password, input.password)

    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Return the user id so the controller can generate the actual token
    return {
      token: String(user.id),
      type: 'bearer',
    }
  }
}
