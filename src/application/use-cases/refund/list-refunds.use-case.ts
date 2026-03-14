import type { IRefundRepository } from '#domain/repositories/i-refund.repository'
import type { RefundEntity } from '#domain/entities/refund.entity'

export class ListRefundsUseCase {
  constructor(private readonly refundRepository: IRefundRepository) {}

  async execute(): Promise<RefundEntity[]> {
    return this.refundRepository.findAll()
  }
}
