import type { RefundRepository, CreateRefundData } from '#domain/repositories/refund.repository'
import type { RefundEntity } from '#domain/entities/refund.entity'
import type { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'
import type { RefundStatus } from '#domain/enums/refund_status.enum'

const TABLE = 'refunds'

type RefundRow = RefundEntity & { id: number }

/** Removes `readonly` modifiers — required when building update objects */
type Mutable<T> = { -readonly [K in keyof T]?: T[K] }

export class InMemoryRefundRepository implements RefundRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: number): Promise<RefundEntity | null> {
    return this.db.findById<RefundRow>(TABLE, id)
  }

  async findByTransactionId(transactionId: number): Promise<RefundEntity[]> {
    return this.db.findMany<RefundRow>(TABLE, (r) => r.transactionId === transactionId)
  }

  async findAll(): Promise<RefundEntity[]> {
    return this.db.findAll<RefundRow>(TABLE)
  }

  async create(data: CreateRefundData): Promise<RefundEntity> {
    const now = new Date()
    return this.db.insert<RefundRow>(TABLE, {
      transactionId: data.transactionId,
      externalId: data.externalId,
      status: data.status,
      amount: data.amount,
      createdAt: now,
    } as Omit<RefundRow, 'id'>)
  }

  async updateStatus(id: number, status: RefundStatus, externalId?: string): Promise<RefundEntity> {
    const updates: Mutable<RefundRow> = { status }
    if (externalId !== undefined) updates.externalId = externalId
    return this.db.update<RefundRow>(TABLE, id, updates as Partial<RefundRow>)
  }
}
