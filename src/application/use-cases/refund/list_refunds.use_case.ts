import type { RefundRepository } from '#domain/repositories/refund.repository'
import type { RefundEntity } from '#domain/entities/refund.entity'

export class ListRefundsUseCase {
  constructor(private readonly refundRepository: RefundRepository) {}

  async execute(): Promise<RefundEntity[]> {
    return this.refundRepository.findAll()
  }
}
