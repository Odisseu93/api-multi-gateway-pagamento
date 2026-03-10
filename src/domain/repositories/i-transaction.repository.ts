import type { TransactionEntity } from '#domain/entities/transaction.entity'
import type { TransactionProductEntity } from '#domain/entities/transaction-product.entity'

export interface CreateTransactionData {
  clientId: number
  gatewayId: number | null
  externalId: string | null
  status: string
  amount: number
  cardLastNumbers: string
  products: Array<{
    productId: number
    quantity: number
    unitAmount: number
  }>
}

export interface ITransactionRepository {
  findById(id: number): Promise<TransactionEntity | null>
  findByIdWithProducts(id: number): Promise<{ transaction: TransactionEntity; products: TransactionProductEntity[] } | null>
  findAll(): Promise<TransactionEntity[]>
  findByClientId(clientId: number): Promise<TransactionEntity[]>
  create(data: CreateTransactionData): Promise<TransactionEntity>
  updateStatus(id: number, status: string, gatewayId?: number, externalId?: string): Promise<TransactionEntity>
}
