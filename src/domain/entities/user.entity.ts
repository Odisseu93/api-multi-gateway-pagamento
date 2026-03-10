import { Role } from '#domain/enums/role.enum'

export interface UserEntityProps {
  readonly id?: number
  readonly name: string
  readonly email: string
  readonly password: string
  readonly role: Role
  readonly createdAt?: Date
  readonly updatedAt?: Date | null
  readonly deletedAt?: Date | null
}

export class UserEntity {
  public readonly id?: number
  public readonly name: string
  public readonly email: string
  public readonly password: string
  public readonly role: Role
  public readonly createdAt?: Date
  public readonly updatedAt?: Date | null
  public readonly deletedAt?: Date | null

  constructor(props: UserEntityProps) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
    this.password = props.password
    this.role = props.role
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN
  }

  hasRole(role: Role): boolean {
    return this.role === role
  }

  hasAnyRole(...roles: Role[]): boolean {
    return roles.includes(this.role)
  }
}
