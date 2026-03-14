export interface RefundInputDto {
  transactionId: number
}

export interface RefundOutputDto {
  transactionId: number
  refundId: number | null
  status: string
  /** Refunded amount in cents */
  amount: number
}
