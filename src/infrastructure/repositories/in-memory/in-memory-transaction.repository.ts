import type {
  ITransactionRepository,
  CreateTransactionData,
} from '#domain/repositories/i-transaction.repository'
import type { TransactionEntity } from '#domain/entities/transaction.entity'
import type { TransactionProductEntity } from '#domain/entities/transaction-product.entity'
import type { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { Money } from '#domain/value-objects/money.vo'
import { type TransactionStatus } from '#domain/enums/transaction-status.enum'

const TRANSACTIONS_TABLE = 'transactions'
const TX_PRODUCTS_TABLE = 'transaction_products'

type TransactionRow = TransactionEntity & { id: number }
type TransactionProductRow = TransactionProductEntity & { id: number }

/** Removes `readonly` modifiers from all keys – needed when building partial update objects */
type Mutable<T> = { -readonly [K in keyof T]?: T[K] }

export class InMemoryTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: number): Promise<TransactionEntity | null> {
    return this.db.findById<TransactionRow>(TRANSACTIONS_TABLE, id)
  }

  async findByIdWithProducts(
    id: number
  ): Promise<{ transaction: TransactionEntity; products: TransactionProductEntity[] } | null> {
    const transaction = await this.findById(id)
    if (!transaction) return null

    const products = this.db.findMany<TransactionProductRow>(
      TX_PRODUCTS_TABLE,
      (tp) => tp.transactionId === id
    )

    return { transaction, products }
  }

  async findAll(): Promise<TransactionEntity[]> {
    return this.db.findAll<TransactionRow>(TRANSACTIONS_TABLE)
  }

  async findByClientId(clientId: number): Promise<TransactionEntity[]> {
    return this.db.findMany<TransactionRow>(TRANSACTIONS_TABLE, (t) => t.clientId === clientId)
  }

  async create(data: CreateTransactionData): Promise<TransactionEntity> {
    const now = new Date()
    const transaction = this.db.insert<TransactionRow>(TRANSACTIONS_TABLE, {
      clientId: data.clientId,
      gatewayId: data.gatewayId,
      externalId: data.externalId,
      status: data.status as TransactionStatus,
      amount: Money.fromCents(data.amount),
      cardLastNumbers: data.cardLastNumbers,
      createdAt: now,
      updatedAt: null,
    } as Omit<TransactionRow, 'id'>)

    for (const product of data.products) {
      this.db.insert<TransactionProductRow>(TX_PRODUCTS_TABLE, {
        transactionId: transaction.id,
        productId: product.productId,
        quantity: product.quantity,
        unitAmount: Money.fromCents(product.unitAmount),
        createdAt: now,
      } as Omit<TransactionProductRow, 'id'>)
    }

    return transaction
  }

  async updateStatus(
    id: number,
    status: string,
    gatewayId?: number,
    externalId?: string
  ): Promise<TransactionEntity> {
    const updates: Mutable<TransactionRow> = { status: status as TransactionStatus }
    if (gatewayId !== undefined) updates.gatewayId = gatewayId
    if (externalId !== undefined) updates.externalId = externalId
    return this.db.update<TransactionRow>(
      TRANSACTIONS_TABLE,
      id,
      updates as Partial<TransactionRow>
    )
  }
}
