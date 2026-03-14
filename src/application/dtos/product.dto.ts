export interface CreateProductInputDto {
  name: string
  /** Amount in cents */
  amount: number
}

export interface UpdateProductInputDto {
  name?: string
  /** Amount in cents */
  amount?: number
  isActive?: boolean
}

export interface ProductOutputDto {
  id: number
  name: string
  /** Amount in cents */
  amount: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}
