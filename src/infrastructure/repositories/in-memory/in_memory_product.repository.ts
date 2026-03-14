import type { IProductRepository } from '#domain/repositories/i-product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'
import type { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'

const TABLE = 'products'

type ProductRow = ProductEntity & { id: number }

export class InMemoryProductRepository implements IProductRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: number): Promise<ProductEntity | null> {
    return this.db.findById<ProductRow>(TABLE, id)
  }

  async findByIds(ids: number[]): Promise<ProductEntity[]> {
    return this.db.findMany<ProductRow>(TABLE, (p) => ids.includes(p.id))
  }

  async findAll(): Promise<ProductEntity[]> {
    return this.db.findAll<ProductRow>(TABLE)
  }

  async create(
    product: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<ProductEntity> {
    const now = new Date()
    return this.db.insert<ProductRow>(TABLE, {
      ...product,
      createdAt: now,
      updatedAt: null,
      deletedAt: null,
    } as Omit<ProductRow, 'id'>)
  }

  async update(
    id: number,
    data: Partial<Pick<ProductEntity, 'name' | 'amount' | 'isActive'>>
  ): Promise<ProductEntity> {
    return this.db.update<ProductRow>(TABLE, id, data)
  }

  async delete(id: number): Promise<void> {
    this.db.delete<ProductRow>(TABLE, id)
  }
}
