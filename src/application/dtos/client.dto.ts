import type { TransactionOutputDto } from './transaction.dto.js'

export interface ClientOutputDto {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt: string | null
  transactions?: TransactionOutputDto[]
}
