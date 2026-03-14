export interface LoginInputDto {
  email: string
  password: string
}

export interface LoginOutputDto {
  token: string
  type: 'bearer'
  expiresAt?: string | null
}
