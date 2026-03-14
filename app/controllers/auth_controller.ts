import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator } from '#validators/auth.validator'
import User from '#models/user'

export default class AuthController {
  /**
   * POST /api/v1/login
   *
   * Verifies credentials via AdonisJS Auth verifyCredentials, then issues
   * a persistent access token via DbAccessTokensProvider.
   */
  async store({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: token.value!.release(),
        type: 'bearer',
      },
    })
  }
}
