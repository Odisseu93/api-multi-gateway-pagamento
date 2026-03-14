import type { IUserRepository } from '#domain/repositories/i-user.repository'
import { NotFoundError } from '#shared/errors/not-found.error'
import { Role } from '#domain/enums/role.enum'
import { AppError } from '#shared/errors/app-error'

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: number, currentUserId: number, currentUserRole: Role): Promise<void> {
    // 1. Cannot delete yourself
    if (id === currentUserId) {
      throw new AppError('You cannot delete your own account', 403, 'FORBIDDEN')
    }

    const targetUser = await this.userRepository.findById(id)
    if (!targetUser) {
      throw new NotFoundError('User', id)
    }

    // 2. MANAGER cannot delete ADMIN
    if (currentUserRole === Role.MANAGER && targetUser.role === Role.ADMIN) {
      throw new AppError('A MANAGER cannot delete an ADMIN user', 403, 'FORBIDDEN')
    }

    await this.userRepository.delete(id)
  }
}
