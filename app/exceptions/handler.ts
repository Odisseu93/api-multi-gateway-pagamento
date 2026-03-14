import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { AppError } from '#shared/errors/app_error'
import { errors as vineErrors } from '@vinejs/vine'
import { errors as limiterErrors } from '@adonisjs/limiter'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // ── AppError (our domain/application errors) ───────────────────────────
    if (error instanceof AppError) {
      return ctx.response.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // ── VineJS validation errors → 422 ────────────────────────────────────
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.messages,
        },
      })
    }

    // ── AdonisJS Limiter rate limit error → 429 ──────────────────────────
    if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
      return ctx.response.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down.',
          retryAfter: error.response.availableIn,
        },
      })
    }

    // ── AdonisJS auth, validation or generic Error with .status ───────────
    if (error instanceof Error && 'status' in error) {
      const httpError = error as Error & { status: number }

      // Map standard HTTP status codes to consistent error structures
      const statusMapping: Record<number, { code: string; message: string }> = {
        400: { code: 'BAD_REQUEST', message: 'Bad request' },
        401: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        403: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' },
        404: { code: 'NOT_FOUND', message: 'The requested resource was not found' },
        409: { code: 'CONFLICT', message: 'The request conflicts with existing data' },
      }

      const mapping = statusMapping[httpError.status]
      if (mapping) {
        // Special case: Invalid credentials should return 401 instead of 400
        if ('code' in httpError && httpError.code === 'E_INVALID_CREDENTIALS') {
          return ctx.response.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHENTICATED',
              message: 'Invalid user credentials',
            },
          })
        }

        return ctx.response.status(httpError.status).json({
          success: false,
          error: mapping,
        })
      }

      // If status >= 500, return a sanitized generic error to avoid leaking details
      if (httpError.status >= 500) {
        return ctx.response.status(httpError.status).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again later.',
          },
        })
      }
    }

    // ── Fallback: generic 500 for anything else that might have leaked ─────
    const status = (error as any)?.status || 500
    if (status >= 500) {
      return ctx.response.status(status).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      })
    }

    // ── Fallback: delegate to AdonisJS default handler ───────────────────
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
