export interface PurchaseItemDto {
  productId: number
  quantity: number
}

export interface PurchaseClientDto {
  name: string
  email: string
}

export interface PurchaseCardDto {
  number: string
  cvv: string
}

export interface PurchaseInputDto {
  client: PurchaseClientDto
  items: PurchaseItemDto[]
  card: PurchaseCardDto
}

export interface PurchaseOutputDto {
  transactionId: number
  externalId: string | null
  status: string
  gatewayId: number | null
  /** Total amount in cents */
  totalAmount: number
  cardLastNumbers: string
}
