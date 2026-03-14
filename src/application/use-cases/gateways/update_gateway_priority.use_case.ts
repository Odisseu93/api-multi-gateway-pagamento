import type { GatewayRepository } from '#domain/repositories/gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'
import { NotFoundError } from '#shared/errors/not_found_error'
import { AppError } from '#shared/errors/app_error'

export interface UpdateGatewayPriorityResult {
  updatedGateway: GatewayEntity
  swappedGateway: GatewayEntity | null
}

/**
 * UpdateGatewayPriorityUseCase
 *
 * Sets the priority of gateway `id` to `newPriority`.
 * If another gateway already has that priority, their priorities are swapped.
 */
export class UpdateGatewayPriorityUseCase {
  constructor(private readonly gatewayRepository: GatewayRepository) {}

  async execute(id: number, newPriority: number): Promise<UpdateGatewayPriorityResult> {
    if (!Number.isInteger(newPriority) || newPriority < 1) {
      throw new AppError('Priority must be a positive integer', 400, 'INVALID_PRIORITY')
    }

    const gateway = await this.gatewayRepository.findById(id)
    if (!gateway) {
      throw new NotFoundError('Gateway', id)
    }

    // Find the gateway that currently holds newPriority (if any) - including inactive ones
    const conflicting = await this.gatewayRepository.findByPriority(newPriority)

    if (conflicting && conflicting.id !== undefined && conflicting.id !== id) {
      // Perform atomic swap using updateMany to avoid constraint violations
      await this.gatewayRepository.updateMany([
        { id, data: { priority: newPriority } },
        { id: conflicting.id, data: { priority: gateway.priority } },
      ])

      const [updatedGateway, swappedGateway] = await Promise.all([
        this.gatewayRepository.findById(id),
        this.gatewayRepository.findById(conflicting.id),
      ])

      return {
        updatedGateway: updatedGateway!,
        swappedGateway: swappedGateway!,
      }
    }

    const updatedGateway = await this.gatewayRepository.update(id, { priority: newPriority })

    return { updatedGateway, swappedGateway: null }
  }
}
