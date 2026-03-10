import { Money } from '#domain/value-objects/money.vo'

export interface ProductEntityProps {
  readonly id?: number
  readonly name: string
  readonly amount: Money
  readonly isActive: boolean
  readonly createdAt?: Date
  readonly updatedAt?: Date | null
  readonly deletedAt?: Date | null
}

export class ProductEntity {
  public readonly id?: number
  public readonly name: string
  public readonly amount: Money
  public readonly isActive: boolean
  public readonly createdAt?: Date
  public readonly updatedAt?: Date | null
  public readonly deletedAt?: Date | null

  constructor(props: ProductEntityProps) {
    this.id = props.id
    this.name = props.name
    this.amount = props.amount
    this.isActive = props.isActive
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }
}
