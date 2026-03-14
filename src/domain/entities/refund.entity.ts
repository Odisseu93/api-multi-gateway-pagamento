import { type Money } from '#domain/value-objects/money.vo'
import { RefundStatus } from '#domain/enums/refund-status.enum'

export interface RefundEntityProps {
  readonly id?: number
  readonly transactionId: number
  readonly externalId: string | null
  readonly status: RefundStatus
  readonly amount: Money
  readonly createdAt?: Date
}

export class RefundEntity {
  public readonly id?: number
  public readonly transactionId: number
  public readonly externalId: string | null
  public readonly status: RefundStatus
  public readonly amount: Money
  public readonly createdAt?: Date

  constructor(props: RefundEntityProps) {
    this.id = props.id
    this.transactionId = props.transactionId
    this.externalId = props.externalId
    this.status = props.status
    this.amount = props.amount
    this.createdAt = props.createdAt
  }

  isApproved(): boolean {
    return this.status === RefundStatus.APPROVED
  }

  isFailed(): boolean {
    return this.status === RefundStatus.FAILED
  }
}
