import { Money } from '#domain/value-objects/money.vo'
import { TransactionStatus } from '#domain/enums/transaction-status.enum'
import type { TransactionProductEntity } from './transaction-product.entity.js'

export interface TransactionEntityProps {
  readonly id?: number
  readonly clientId: number
  readonly gatewayId: number | null
  readonly externalId: string | null
  readonly status: TransactionStatus
  readonly amount: Money
  readonly cardLastNumbers: string
  readonly createdAt?: Date
  readonly updatedAt?: Date | null
}

export class TransactionEntity {
  public readonly id?: number
  public readonly clientId: number
  public readonly gatewayId: number | null
  public readonly externalId: string | null
  public readonly status: TransactionStatus
  public readonly amount: Money
  public readonly cardLastNumbers: string
  public readonly createdAt?: Date
  public readonly updatedAt?: Date | null

  constructor(props: TransactionEntityProps) {
    this.id = props.id
    this.clientId = props.clientId
    this.gatewayId = props.gatewayId
    this.externalId = props.externalId
    this.status = props.status
    this.amount = props.amount
    this.cardLastNumbers = props.cardLastNumbers
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  /** A transaction can only be refunded if it was successfully paid */
  canBeRefunded(): boolean {
    return this.status === TransactionStatus.PAID
  }

  /** Calculate total amount from a list of transaction products */
  static calculateTotalAmount(products: TransactionProductEntity[]): Money {
    return products.reduce((total, product) => total.add(product.subtotal()), Money.fromCents(0))
  }
}
