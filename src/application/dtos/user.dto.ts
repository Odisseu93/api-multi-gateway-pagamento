import type { Role } from '#domain/enums/role.enum'

export interface CreateUserInputDto {
  name: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserInputDto {
  name?: string
  email?: string
  password?: string
  role?: Role
}

export interface UserOutputDto {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string | null
}
