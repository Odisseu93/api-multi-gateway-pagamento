import type { RefundEntity } from '#domain/entities/refund.entity'
import type { RefundStatus } from '#domain/enums/refund-status.enum'
import type { Money } from '#domain/value-objects/money.vo'

export interface CreateRefundData {
  transactionId: number
  externalId: string | null
  status: RefundStatus
  amount: Money
}

export interface IRefundRepository {
  findById(id: number): Promise<RefundEntity | null>
  findByTransactionId(transactionId: number): Promise<RefundEntity[]>
  create(data: CreateRefundData): Promise<RefundEntity>
  updateStatus(id: number, status: RefundStatus, externalId?: string): Promise<RefundEntity>
}
