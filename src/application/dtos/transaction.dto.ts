export interface TransactionProductOutputDto {
  productId: number
  productName: string
  quantity: number
  /** Unit price snapshot in cents */
  unitAmount: number
  /** Line total in cents */
  subtotal: number
}

export interface TransactionOutputDto {
  id: number
  clientId: number
  gatewayId: number | null
  externalId: string | null
  status: string
  /** Total amount in cents */
  totalAmount: number
  cardLastNumbers: string
  products?: TransactionProductOutputDto[]
  createdAt: string
  updatedAt: string | null
}
