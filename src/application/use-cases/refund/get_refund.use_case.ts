import type { RefundRepository } from '#domain/repositories/refund.repository'
import type { RefundEntity } from '#domain/entities/refund.entity'
import { AppError } from '#shared/errors/app_error'

export class GetRefundUseCase {
  constructor(private readonly refundRepository: RefundRepository) {}

  async execute(id: number): Promise<RefundEntity> {
    const refund = await this.refundRepository.findById(id)
    if (!refund) {
      throw new AppError('Refund not found', 404, 'REFUND_NOT_FOUND')
    }
    return refund
  }
}
