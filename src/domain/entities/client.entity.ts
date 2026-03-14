export interface ClientEntityProps {
  readonly id?: number
  readonly name: string
  readonly email: string
  readonly createdAt?: Date
  readonly updatedAt?: Date | null
  readonly deletedAt?: Date | null
}

export class ClientEntity {
  public readonly id?: number
  public readonly name: string
  public readonly email: string
  public readonly createdAt?: Date
  public readonly updatedAt?: Date | null
  public readonly deletedAt?: Date | null

  constructor(props: ClientEntityProps) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }
}
