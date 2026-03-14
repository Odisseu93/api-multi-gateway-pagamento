import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Role } from '#domain/enums/role.enum'
import { AppError } from '#shared/errors/app-error'

/**
 * RolesAuthorizationMiddleware (Role Guard)
 *
 * Checks that the authenticated user holds one of the allowed roles.
 * Must be used AFTER the `auth` middleware (which injects `ctx.auth.user`).
 *
 * Usage in routes:
 *   .use(middleware.authorize([Role.ADMIN, Role.MANAGER]))
 */
export default class RolesAuthorizationMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles: Role[] } = { roles: [] }) {
    const user = ctx.auth.user as { role?: Role } | undefined

    if (!user) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED')
    }

    if (options.roles.length > 0 && !options.roles.includes(user.role as Role)) {
      throw new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN')
    }

    return next()
  }
}
