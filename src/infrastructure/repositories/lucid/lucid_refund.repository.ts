import type { RefundRepository, CreateRefundData } from '#domain/repositories/refund.repository'
import type { RefundEntity } from '#domain/entities/refund.entity'
import { RefundEntity as RefundEntityClass } from '#domain/entities/refund.entity'
import { type RefundStatus } from '#domain/enums/refund_status.enum'
import { Money } from '#domain/value-objects/money.vo'
import Refund from '#models/refund'

function toEntity(model: Refund): RefundEntity {
  return new RefundEntityClass({
    id: model.id,
    transactionId: model.transactionId,
    externalId: model.externalId,
    status: model.status as RefundStatus,
    amount: Money.fromCents(model.amount),
    createdAt: model.createdAt?.toJSDate(),
  })
}

export class LucidRefundRepository implements RefundRepository {
  async findById(id: number): Promise<RefundEntity | null> {
    const model = await Refund.find(id)
    return model ? toEntity(model) : null
  }

  async findByTransactionId(transactionId: number): Promise<RefundEntity[]> {
    const models = await Refund.query().where('transaction_id', transactionId)
    return models.map(toEntity)
  }

  async findAll(): Promise<RefundEntity[]> {
    const models = await Refund.all()
    return models.map(toEntity)
  }

  async create(data: CreateRefundData): Promise<RefundEntity> {
    const model = await Refund.create({
      transactionId: data.transactionId,
      externalId: data.externalId,
      status: data.status,
      amount: data.amount.cents,
    })
    return toEntity(model)
  }

  async updateStatus(id: number, status: RefundStatus, externalId?: string): Promise<RefundEntity> {
    const model = await Refund.findOrFail(id)
    model.status = status
    if (externalId !== undefined) model.externalId = externalId
    await model.save()
    return toEntity(model)
  }
}
