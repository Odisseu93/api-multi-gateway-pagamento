import { Money } from '#domain/value-objects/money.vo'

export interface TransactionProductEntityProps {
  readonly id?: number
  readonly transactionId: number
  readonly productId: number
  readonly quantity: number
  readonly unitAmount: Money
  readonly createdAt?: Date
}

export class TransactionProductEntity {
  public readonly id?: number
  public readonly transactionId: number
  public readonly productId: number
  public readonly quantity: number
  public readonly unitAmount: Money
  public readonly createdAt?: Date

  constructor(props: TransactionProductEntityProps) {
    this.id = props.id
    this.transactionId = props.transactionId
    this.productId = props.productId
    this.quantity = props.quantity
    this.unitAmount = props.unitAmount
    this.createdAt = props.createdAt
  }

  /** Subtotal for this line item: unitAmount × quantity */
  subtotal(): Money {
    return this.unitAmount.multiply(this.quantity)
  }
}
