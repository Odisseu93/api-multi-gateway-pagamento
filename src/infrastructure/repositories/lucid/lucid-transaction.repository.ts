import type {
  ITransactionRepository,
  CreateTransactionData,
} from '#domain/repositories/i-transaction.repository'
import type { TransactionEntity } from '#domain/entities/transaction.entity'
import type { TransactionProductEntity } from '#domain/entities/transaction-product.entity'
import { TransactionEntity as TransactionEntityClass } from '#domain/entities/transaction.entity'
import { TransactionProductEntity as TransactionProductEntityClass } from '#domain/entities/transaction-product.entity'
import { type TransactionStatus } from '#domain/enums/transaction-status.enum'
import { Money } from '#domain/value-objects/money.vo'
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

function toEntity(model: Transaction): TransactionEntity {
  return new TransactionEntityClass({
    id: model.id,
    clientId: model.clientId,
    gatewayId: model.gatewayId,
    externalId: model.externalId,
    status: model.status as TransactionStatus,
    amount: Money.fromCents(model.amount),
    cardLastNumbers: model.cardLastNumbers,
    createdAt: model.createdAt?.toJSDate(),
    updatedAt: model.updatedAt?.toJSDate() ?? null,
  })
}

function toProductEntity(model: TransactionProduct): TransactionProductEntity {
  return new TransactionProductEntityClass({
    id: model.id,
    transactionId: model.transactionId,
    productId: model.productId,
    quantity: model.quantity,
    unitAmount: Money.fromCents(model.unitAmount),
    createdAt: model.createdAt?.toJSDate(),
  })
}

export class LucidTransactionRepository implements ITransactionRepository {
  async findById(id: number): Promise<TransactionEntity | null> {
    const model = await Transaction.find(id)
    return model ? toEntity(model) : null
  }

  async findByIdWithProducts(
    id: number
  ): Promise<{ transaction: TransactionEntity; products: TransactionProductEntity[] } | null> {
    const model = await Transaction.query().where('id', id).preload('products').first()
    if (!model) return null

    const products = (model.products ?? []).map(toProductEntity)
    return { transaction: toEntity(model), products }
  }

  async findAll(): Promise<TransactionEntity[]> {
    const models = await Transaction.all()
    return models.map(toEntity)
  }

  async findByClientId(clientId: number): Promise<TransactionEntity[]> {
    const models = await Transaction.query().where('client_id', clientId)
    return models.map(toEntity)
  }

  async create(data: CreateTransactionData): Promise<TransactionEntity> {
    return await db.transaction(async (trx: TransactionClientContract) => {
      const transaction = await Transaction.create(
        {
          clientId: data.clientId,
          gatewayId: data.gatewayId,
          externalId: data.externalId,
          status: data.status,
          amount: data.amount,
          cardLastNumbers: data.cardLastNumbers,
        },
        { client: trx }
      )

      await TransactionProduct.createMany(
        data.products.map((p) => ({
          transactionId: transaction.id,
          productId: p.productId,
          quantity: p.quantity,
          unitAmount: p.unitAmount,
        })),
        { client: trx }
      )

      return toEntity(transaction)
    })
  }

  async updateStatus(
    id: number,
    status: string,
    gatewayId?: number,
    externalId?: string
  ): Promise<TransactionEntity> {
    const model = await Transaction.findOrFail(id)
    model.status = status
    if (gatewayId !== undefined) model.gatewayId = gatewayId
    if (externalId !== undefined) model.externalId = externalId
    await model.save()
    return toEntity(model)
  }
}
