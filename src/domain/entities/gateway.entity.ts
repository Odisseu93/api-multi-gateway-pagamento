export interface GatewayEntityProps {
  readonly id?: number
  readonly name: string
  readonly type: string
  readonly isActive: boolean
  readonly priority: number
  readonly credentials?: string | null
  readonly createdAt?: Date
  readonly updatedAt?: Date | null
}

export class GatewayEntity {
  public readonly id?: number
  public readonly name: string
  public readonly type: string
  public readonly isActive: boolean
  public readonly priority: number
  public readonly credentials?: string | null
  public readonly createdAt?: Date
  public readonly updatedAt?: Date | null

  constructor(props: GatewayEntityProps) {
    this.id = props.id
    this.name = props.name
    this.type = props.type
    this.isActive = props.isActive
    this.priority = props.priority
    this.credentials = props.credentials
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }
}
