import type { HttpContext } from '@adonisjs/core/http'
import { createUserValidator, updateUserValidator } from '#validators/user.validator'
import { CreateUserUseCase } from '#application/use-cases/users/create-user.use-case'
import { UpdateUserUseCase } from '#application/use-cases/users/update-user.use-case'
import { DeleteUserUseCase } from '#application/use-cases/users/delete-user.use-case'
import { ListUsersUseCase } from '#application/use-cases/users/list-users.use-case'
import { GetUserUseCase } from '#application/use-cases/users/get-user.use-case'
import { LucidUserRepository } from '#infrastructure/repositories/lucid/lucid-user.repository'


export default class UserController {
  private transform(user: any) {
    const { password, ...rest } = user
    return rest
  }

  /** GET /api/v1/users */
  async index({ response }: HttpContext) {
    const useCase = new ListUsersUseCase(new LucidUserRepository())
    
    const users = await useCase.execute()
    return response.ok({ success: true, data: users.map((u) => this.transform(u)) })
  }

  /** GET /api/v1/users/:id */
  async show({ params, response }: HttpContext) {
    const useCase = new GetUserUseCase(new LucidUserRepository())
    
    const user = await useCase.execute(Number(params.id))
    return response.ok({ success: true, data: this.transform(user) })
  }

  /** POST /api/v1/users */
  async store({ request, response }: HttpContext) {
    const input = await request.validateUsing(createUserValidator)
    const useCase = new CreateUserUseCase(new LucidUserRepository())
    
    const user = await useCase.execute(input as any)
    return response.created({ success: true, data: this.transform(user) })
  }

  /** PUT /api/v1/users/:id */
  async update({ params, request, response }: HttpContext) {
    const input = await request.validateUsing(updateUserValidator)
    const useCase = new UpdateUserUseCase(new LucidUserRepository())
    
    const user = await useCase.execute(Number(params.id), input as any)
    return response.ok({ success: true, data: this.transform(user) })
  }

  /** DELETE /api/v1/users/:id */
  async destroy({ params, auth, response }: HttpContext) {
    const useCase = new DeleteUserUseCase(new LucidUserRepository())
    const currentUser = auth.user!
    
    await useCase.execute(Number(params.id), currentUser.id, currentUser.role as any)
    return response.noContent()
  }
}
