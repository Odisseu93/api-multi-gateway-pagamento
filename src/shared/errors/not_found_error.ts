import { AppError } from './app_error.js'

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND')
  }
}
