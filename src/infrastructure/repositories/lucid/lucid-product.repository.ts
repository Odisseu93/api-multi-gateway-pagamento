import type { IProductRepository } from '#domain/repositories/i-product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'
import { ProductEntity as ProductEntityClass } from '#domain/entities/product.entity'
import { Money } from '#domain/value-objects/money.vo'
import Product from '#models/product'
import { DateTime } from 'luxon'

function toEntity(model: Product): ProductEntity {
  return new ProductEntityClass({
    id: model.id,
    name: model.name,
    amount: Money.fromCents(model.amount),
    isActive: model.isActive,
    createdAt: model.createdAt?.toJSDate(),
    updatedAt: model.updatedAt?.toJSDate() ?? null,
    deletedAt: model.deletedAt?.toJSDate() ?? null,
  })
}

export class LucidProductRepository implements IProductRepository {
  async findById(id: number): Promise<ProductEntity | null> {
    const model = await Product.query().where('id', id).whereNull('deleted_at').first()
    return model ? toEntity(model) : null
  }

  async findByIds(ids: number[]): Promise<ProductEntity[]> {
    const models = await Product.query().whereIn('id', ids).whereNull('deleted_at')
    return models.map(toEntity)
  }

  async findAll(): Promise<ProductEntity[]> {
    const models = await Product.query().whereNull('deleted_at')
    return models.map(toEntity)
  }

  async create(
    product: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<ProductEntity> {
    const model = await Product.create({
      name: product.name,
      amount: product.amount.cents,
      isActive: product.isActive,
    })
    return toEntity(model)
  }

  async update(
    id: number,
    data: Partial<Pick<ProductEntity, 'name' | 'amount' | 'isActive'>>
  ): Promise<ProductEntity> {
    const model = await Product.findOrFail(id)
    if (data.name !== undefined) model.name = data.name
    if (data.amount !== undefined) model.amount = data.amount.cents
    if (data.isActive !== undefined) model.isActive = data.isActive
    await model.save()
    return toEntity(model)
  }

  async delete(id: number): Promise<void> {
    const model = await Product.findOrFail(id)
    model.deletedAt = DateTime.now()
    await model.save()
  }
}
